import json
import logging.config
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR  / "logs"
CONFIG_PATH = BASE_DIR / "logging.json"

def setup_logging():
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, encoding="utf-8") as f:
        config = json.load(f)
    config["handlers"]["file_handler"]["filename"] = str(LOG_DIR / "app.log")
    logging.config.dictConfig(config)