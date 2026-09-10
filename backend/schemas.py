from enum import Enum
from datetime import date
from pydantic import BaseModel, Field, EmailStr, GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source: type, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema(
                    [
                        core_schema.str_schema(),
                        core_schema.no_info_plain_validator_function(cls.validate),
                    ]
                ),
            ]
        )

    @classmethod
    def validate(cls, v: str) -> ObjectId:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class ProficiencyLevel(str, Enum):
    BEGINNER = "beginner"
    ELEMENTARY = "elementary"
    INTERMEDIATE = "intermediate"
    UPPER_INTERMEDIATE = "upper_intermediate"
    ADVANCED = "advanced"
    NATIVE = "native"


class ProgrammingLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class SchoolSubject(str, Enum):
    MATHEMATICS = "mathematics"
    PHYSICS = "physics"
    CHEMISTRY = "chemistry"
    BIOLOGY = "biology"
    COMPUTER_SCIENCE = "computer_science"
    HISTORY = "history"
    GEOGRAPHY = "geography"
    LITERATURE = "literature"
    ENGLISH = "english"
    OTHER = "other"


class UserPersonalInfo(BaseModel):
    first_name: str = Field(min_length=1, max_length=20)
    last_name: str = Field(min_length=1, max_length=20)
    preferred_name: str | None = Field(default=None, min_length=1, max_length=20)

    email: EmailStr
    phone: str = Field(min_length=10, max_length=15)

    date_of_birth: date
    nationality: str = Field(min_length=1, max_length=20)
    country_of_residence: str = Field(min_length=1, max_length=30)
    gender: Gender


class Language(BaseModel):
    name: str = Field(min_length=1, max_length=30)
    proficiency: ProficiencyLevel


class Job(BaseModel):
    job_title: str = Field(min_length=1, max_length=50)
    location: str = Field(min_length=1, max_length=50)
    company: str = Field(min_length=1, max_length=50)
    from_date: date
    to_date: date | None = None
    description: str | None = Field(default=None, min_length=10, max_length=300)


class ScientificInterest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=10, max_length=300)


class Publication(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    journal: str | None = Field(default=None, max_length=100)
    publication_date: date | None = None
    authors: list[str] = Field(default_factory=list)
    url: str | None = None


class Award(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    organization: str | None = Field(default=None, max_length=100)
    date: date | None = None
    description: str | None = Field(default=None, min_length=10, max_length=300)


class ProgrammingSkill(BaseModel):
    language: str = Field(min_length=1, max_length=50)
    level: ProgrammingLevel


class DeviceAccess(BaseModel):
    weekly_hours: float = Field(ge=0)


class Hobby(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class UserCV(BaseModel):
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "extra": "forbid",
    }

    id: PyObjectId | None = Field(default=None, alias="_id")
    photo: str | None = None

    personal_info: UserPersonalInfo
    languages: list[Language]
    work_experience: list[Job]
    scientific_interests: list[ScientificInterest]
    publications: list[Publication]
    awards: list[Award]
    favorite_subjects_in_school: list[SchoolSubject]
    programming_skills: list[ProgrammingSkill]
    device_access: DeviceAccess
    hobbies: list[Hobby]
