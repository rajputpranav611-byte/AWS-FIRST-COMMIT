import json
import sys
import os

# Add src to path to import rules and agent
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from rules import score
from agent import analyse

def main():
    cases = []
    with open('cases.jsonl', 'r') as f:
        for line in f:
            cases.append(json.loads(line))
            
    with open(os.path.join('..', 'src', 'playbooks.json'), 'r') as f:
        playbooks = json.load(f)

    tp, fp, tn, fn = 0, 0, 0, 0

    print("Running evaluations...")
    for idx, case in enumerate(cases):
        text = case['text']
        true_label = case['label']
        
        rule_scores = score(text)
        try:
            agent_result = analyse(text, rule_scores, playbooks)
            predicted = agent_result.get('verdict', 'unknown')
        except Exception as e:
            print(f"Error analysing case {idx}: {e}")
            predicted = 'unknown'

        # Consider 'suspicious' as 'scam' for recall purposes, or just strict match.
        # Let's map 'suspicious' and 'scam' -> 'scam', 'legit' -> 'legit'
        if predicted in ['scam', 'suspicious']:
            pred_label = 'scam'
        else:
            pred_label = 'legit'
            
        if true_label == 'scam' and pred_label == 'scam':
            tp += 1
        elif true_label == 'scam' and pred_label == 'legit':
            fn += 1
        elif true_label == 'legit' and pred_label == 'scam':
            fp += 1
        elif true_label == 'legit' and pred_label == 'legit':
            tn += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

    print("\n--- Evaluation Results ---")
    print(f"Precision: {precision:.2f}")
    print(f"Recall:    {recall:.2f}")
    print("\nConfusion Matrix:")
    print(f"               Predicted Scam | Predicted Legit")
    print(f"Actual Scam  |      {tp:2d}        |       {fn:2d}")
    print(f"Actual Legit |      {fp:2d}        |       {tn:2d}")
    
    if recall < 0.75:
        print("\nFailed: Recall is below 0.75 threshold.")
        sys.exit(1)
    else:
        print("\nSuccess: Recall is >= 0.75.")
        sys.exit(0)

if __name__ == '__main__':
    main()
