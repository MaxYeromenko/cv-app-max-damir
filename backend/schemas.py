from enum import Enum
from datetime import date as dt
from pydantic import BaseModel, Field, EmailStr


USER_CV_UPDATE_ALLOWED_FIELDS = (
      "photo",

      "personal_info.first_name",
      "personal_info.last_name",
      "personal_info.preferred_name",
      "personal_info.email",
      "personal_info.phone",
      "personal_info.date_of_birth",
      "personal_info.nationality",
      "personal_info.country_of_residence",
      "personal_info.gender",

      "languages",
      "work_experience",
      "scientific_interests",
      "publications",
      "awards",
      "favorite_subjects_in_school",
      "programming_skills",

      "device_access.weekly_hours",

      "hobbies",
)


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
    model_config = {
        "extra": "forbid",
    }
    first_name: str = Field(min_length=1, max_length=20)
    last_name: str = Field(min_length=1, max_length=20)
    preferred_name: str | None = Field(default=None, min_length=1, max_length=20)

    email: EmailStr
    phone: str = Field(min_length=10, max_length=15)

    date_of_birth: dt
    nationality: str = Field(min_length=1, max_length=20)
    country_of_residence: str = Field(min_length=1, max_length=30)
    gender: Gender


class Language(BaseModel):
    model_config = {
        "extra": "forbid",
    }
    name: str = Field(min_length=1, max_length=30)
    proficiency: ProficiencyLevel


class Job(BaseModel):
    model_config = {
        "extra": "forbid",
    }
    job_title: str = Field(min_length=1, max_length=50)
    location: str = Field(min_length=1, max_length=50)
    company: str = Field(min_length=1, max_length=50)
    from_date: dt
    to_date: dt | None = None
    description: str | None = Field(default=None, min_length=10, max_length=300)


class ScientificInterest(BaseModel):
    model_config = {
        "extra": "forbid",
    }
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=10, max_length=300)


class Publication(BaseModel):
    model_config = {
        "extra": "forbid",
    }
    title: str = Field(min_length=1, max_length=200)
    journal: str | None = Field(default=None, max_length=100)
    publication_date: dt | None = None
    authors: list[str] = Field(default_factory=list)
    url: str | None = None


class Award(BaseModel):
    model_config = {
        "extra": "forbid",
    }
    title: str = Field(min_length=1, max_length=100)
    organization: str | None = Field(default=None, max_length=100)
    date: dt | None = None
    description: str | None = Field(default=None, min_length=10, max_length=300)


class ProgrammingSkill(BaseModel):
    model_config = {
        "extra": "forbid",
    }
    language: str = Field(min_length=1, max_length=50)
    level: ProgrammingLevel


class DeviceAccess(BaseModel):
    model_config = {
        "extra": "forbid",
    }
    weekly_hours: float = Field(ge=0)


class Hobby(BaseModel):
    model_config = {
        "extra": "forbid",
    }
    name: str = Field(min_length=1, max_length=50)


class UserCVRequest(BaseModel):
    model_config = {
        "extra": "forbid",
    }

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

class UserCVResponse(UserCVRequest):
    pass

