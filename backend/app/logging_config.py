import json
import logging.config
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent

def setup_logging() -> None:
    os.makedirs(BASE_DIR / "logs", exist_ok=True)

    with open(BASE_DIR / "logging.json", "r", encoding="utf-8") as conf_file:
        CONFIG = json.load(conf_file)

    logging.config.dictConfig(CONFIG)
