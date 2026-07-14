#!/usr/bin/env python3
"""
fetch_copernicus_wave.py

Recupera altezza/periodo/direzione onda per un singolo punto (lat, lon)
dal Copernicus Marine Service (CMEMS), usando il Copernicus Marine Toolbox
ufficiale (unico modo supportato per l'accesso programmatico ai dati CMEMS:
https://help.marine.copernicus.eu/en/articles/7949409).

Il toolbox è Python-only: per questo il backend Node invoca questo script
come sottoprocesso (vedi src/services/marineService.js -> fetchCopernicusMarine).

Prodotto usato: MEDSEA_ANALYSISFORECAST_WAV_006_017
  (Mediterranean Sea Waves Analysis and Forecast, WAM Cycle 6, 1/24 deg,
   campi orari istantanei).
Variabili:
  - VHM0  altezza significativa dell'onda (m)
  - VTPK  periodo di picco dell'onda (s)
  - VMDR  direzione media dell'onda (gradi)

Requisiti:
  pip install copernicusmarine
  Credenziali già salvate in locale con `copernicusmarine login`
  (oppure passate via env COPERNICUSMARINE_SERVICE_USERNAME / _PASSWORD,
  gestite automaticamente dal toolbox).

IMPORTANTE: il dataset_id tecnico esatto (es. "cmems_mod_med_wav_anfc_4.2km_PT1H-i")
può cambiare tra versioni del toolbox/prodotto. Prima del primo utilizzo in
produzione, verificare l'id corrente con:
    copernicusmarine describe --contains MEDSEA_ANALYSISFORECAST_WAV_006_017
e aggiornare il default sotto o passare --dataset-id esplicitamente.

Uso:
    python3 fetch_copernicus_wave.py <lat> <lon> [--dataset-id ID]

Output: un singolo oggetto JSON su stdout.
"""

import sys
import json
import argparse
import datetime

DEFAULT_DATASET_ID = "cmems_mod_med_wav_anfc_4.2km_PT1H-i"
VARIABLES = ["VHM0", "VTPK", "VMDR"]


def emit_error(code, message):
    print(json.dumps({"error": code, "message": message}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("lat", type=float)
    parser.add_argument("lon", type=float)
    parser.add_argument("--dataset-id", default=DEFAULT_DATASET_ID)
    args = parser.parse_args()

    try:
        import copernicusmarine
    except ImportError:
        emit_error(
            "MISSING_DEPENDENCY",
            "Pacchetto 'copernicusmarine' non installato. Esegui: pip install copernicusmarine",
        )
        sys.exit(1)

    now = datetime.datetime.utcnow()
    # Finestra stretta intorno all'istante corrente: sufficiente per il campo
    # orario più vicino, senza scaricare più dati del necessario.
    start = now - datetime.timedelta(hours=3)
    end = now + datetime.timedelta(hours=3)

    try:
        ds = copernicusmarine.open_dataset(
            dataset_id=args.dataset_id,
            variables=VARIABLES,
            minimum_longitude=args.lon,
            maximum_longitude=args.lon,
            minimum_latitude=args.lat,
            maximum_latitude=args.lat,
            start_datetime=start.isoformat(),
            end_datetime=end.isoformat(),
            # Il toolbox seleziona direttamente il punto griglia più vicino:
            # non serve fare noi l'interpolazione/nearest-neighbour manuale.
            coordinates_selection_method="nearest",
        )

        point = ds.sel(time=now, method="nearest")

        result = {
            "source": "copernicus-marine-cmems",
            "datasetId": args.dataset_id,
            "waveHeightM": round(float(point["VHM0"].values), 2),
            "wavePeriodS": round(float(point["VTPK"].values), 1),
            "waveDirectionDeg": round(float(point["VMDR"].values), 0),
            "timestamp": str(point["time"].values),
        }
        print(json.dumps(result))

    except Exception as e:  # noqa: BLE001 - vogliamo comunque un JSON di errore leggibile da Node
        emit_error("CMEMS_FETCH_ERROR", str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
