import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from rules import score

def test_score_urgency():
    res = score("Act now within 24 hours")
    assert res['urgency'] == 1.0
    assert res['total'] >= 0.2

def test_score_authority():
    res = score("CBI notice of arrest")
    assert res['authority'] == 1.0

def test_score_legit():
    res = score("Hello, can we have dinner tonight?")
    assert res['total'] == 0.0
    assert res['urgency'] == 0.0
    assert res['authority'] == 0.0
