import json
from app.schemas import *

with open("schemas/request_example.json", 'r', encoding="utf-8") as req_exm_file:
    payload = json.load(req_exm_file)

payload['personal_info']["first_name"] = ""

model = UserCVRequest(**payload)