"""Validates the small, authored concept graph in content/learning_paths.yaml."""

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Check(Strict):
    prompt: str
    choices: list[str] = Field(min_length=2)
    answer: int
    explanation: str

    @model_validator(mode="after")
    def valid_answer(self):
        if not 0 <= self.answer < len(self.choices):
            raise ValueError("check answer is outside the choices")
        return self


class CueCard(Strict):
    elevator_pitch: str
    pillars: list[str] = Field(min_length=3, max_length=4)
    tradeoffs: list[str] = Field(min_length=1)
    candidate_trap: str


class LessonBody(Strict):
    situation: str
    explanation: str
    terms: list[dict[str, str]] = Field(min_length=1)
    worked_example: str
    second_example: str
    checks: list[Check] = Field(min_length=2)
    sources: list[str] = Field(default_factory=list)


class LessonDefinition(Strict):
    id: str
    title: str
    summary: str
    position: int
    prerequisites: list[str] = Field(default_factory=list)
    content: LessonBody


class ModuleDefinition(Strict):
    id: str
    citadel_id: str
    title: str
    summary: str
    position: int
    cue_card: CueCard
    lessons: list[LessonDefinition] = Field(min_length=1)


class ChallengeMapping(Strict):
    slug: str
    requires: list[str] = Field(min_length=1)


class LearningPaths(Strict):
    modules: list[ModuleDefinition] = Field(min_length=1)
    challenges: list[ChallengeMapping] = Field(default_factory=list)
