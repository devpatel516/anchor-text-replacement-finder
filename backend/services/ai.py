from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field
from typing import List,Literal

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
load_dotenv()
app = FastAPI(title="ATRF AI Analysis Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)
class InputSchema(BaseModel):
    url:str
    title:str
    content:str
    anchorText:str
    anchorTextLink:str

class TaskScenarioOutput(BaseModel):
    Target_Page: str = Field(alias="Target Page", description="The URL of the page being analyzed.")
    matched_scenario: Literal["SCENARIO_1", "SCENARIO_2", "SCENARIO_3", "SCENARIO_4"] = Field(
        description="The chosen scenario out of the 4 that best fits this page content natively."
    )
    before: str = Field(description="The original sentence from the content before any modification. For Scenario 1, this represents the sentence you are inserting AFTER.")
    after: str = Field(description="The new or modified sentence structure complete with the added phrase/anchor text.")
    anchor_text: str = Field(alias="anchor text", description="The exact anchor text selected for the backlink.")
    anchor_Url: str = Field(alias="anchor Url", description="A highly relevant, contextually appropriate external URL for the anchor text.")

llm=ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)

structured_llm = llm.with_structured_output(TaskScenarioOutput, method="json_schema")

system_prompt = (
        "You are an expert SEO and content strategist automation engine.\n"
        "Your task is to analyze the provided page content and automatically determine which of the following 4 scenarios is most appropriate to generate an editorial link insertion:\n\n"
        "SCENARIO 1: NEW PHRASE ADD (Insert a new sentence with an anchor link right AFTER an existing line)\n"
        "SCENARIO 2: PHRASE REPLACE (Replace an entire existing sentence with a new version containing an anchor link)\n"
        "SCENARIO 3: ALREADY EXISTED (Identify if an anchor link naturally fits natively within the existing text structure without altering it)\n"
        "SCENARIO 4: PHRASE APPEND/MODIFY (Take an existing sentence and append contextually relevant descriptive terms containing an anchor link to it)\n\n"
        "CRITICAL INSTRUCTION:\n"
        "Pick the upto three urls from input given to you and classify them,based on that scenarios, populate the JSON fields:\n"
        "- 'Target Page': The input URL.\n"
        "- 'before': The targeted text framework from the content.\n"
        "- 'after': The finalized edited text line.\n"
        "- 'anchor text': The keyword phrase selected to host the hyperlink.\n"
        "- 'anchor Url': A realistic destination URL contextually fitting the anchor text.\n"
    )

prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Analyze this input data and generate the output structure for the best scenario:\n\n{input_data}")
    ])
chain = prompt_template | structured_llm
# response = chain.invoke({"input_data": str(user_input)})
# print(response.model_dump_json(by_alias=True, indent=2))


@app.get("/healthAi")
async def health_check_ai():
    return "AI service is working..."
@app.post("/api/analyze")
async def analyze(inp:List[InputSchema]):
    try:
        inpData=[i.model_dump() for i in inp]
        response=chain.invoke({"input_data":str(inpData)})
        #print(response.model_dump_json(by_alias=True))
        return response.model_dump(by_alias=True)
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))