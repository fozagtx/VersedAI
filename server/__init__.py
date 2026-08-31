"""
VersedAI Agent Package
ADK deploy entry point — exports root `agent` variable
"""
from .agent import get_tutor_agent

# ADK deploy cloud_run looks for `agent` at module level
agent = get_tutor_agent()
