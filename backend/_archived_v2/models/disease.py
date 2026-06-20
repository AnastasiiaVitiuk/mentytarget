from pydantic import BaseModel

class DiseaseRequest(BaseModel):
    disease: str