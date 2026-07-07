import csv
import random
import numpy as np

majors = [
    "Computer Science & IT", "Business Administration", "Accounting & Finance",
    "Civil Engineering", "Electrical Engineering", "Medicine & Health Sciences",
    "Nursing", "Education & Teaching", "Law", "Tourism & Hospitality",
    "Agriculture", "Architecture", "Environmental Science",
    "Media & Communication", "International Relations"
]

major_profiles = {
    "Computer Science & IT": {"math": 88, "physics": 85, "chem": 72, "sci": 78, "bio": 65, "khmer": 72, "english": 80, "hist": 68, "geo": 65, "interests": ["technology", "engineering"], "personality": {"analytical": 4.2, "creative": 3.5}},
    "Business Administration": {"math": 75, "english": 84, "khmer": 78, "sci": 65, "bio": 60, "hist": 72, "geo": 70, "phys": 62, "chem": 60, "interests": ["business"], "personality": {"creative": 4.0, "people_oriented": 4.2}},
    "Accounting & Finance": {"math": 84, "english": 78, "khmer": 74, "sci": 68, "bio": 62, "hist": 70, "geo": 68, "phys": 70, "chem": 65, "interests": ["business"], "personality": {"analytical": 4.5, "detail_oriented": 4.5}},
    "Civil Engineering": {"math": 86, "physics": 84, "chem": 75, "sci": 80, "bio": 65, "khmer": 70, "english": 75, "hist": 65, "geo": 72, "interests": ["engineering"], "personality": {"analytical": 4.3, "detail_oriented": 4.2}},
    "Electrical Engineering": {"math": 90, "physics": 88, "chem": 74, "sci": 80, "bio": 62, "khmer": 68, "english": 78, "hist": 62, "geo": 62, "interests": ["engineering", "technology"], "personality": {"analytical": 4.6}},
    "Medicine & Health Sciences": {"bio": 92, "chem": 88, "sci": 82, "math": 82, "phys": 75, "khmer": 74, "english": 80, "hist": 68, "geo": 65, "interests": ["medicine"], "personality": {"analytical": 4.4, "detail_oriented": 4.5}},
    "Nursing": {"bio": 84, "chem": 78, "sci": 78, "math": 72, "phys": 65, "khmer": 78, "english": 78, "hist": 70, "geo": 67, "interests": ["medicine"], "personality": {"people_oriented": 4.6}},
    "Education & Teaching": {"khmer": 88, "english": 82, "hist": 84, "geo": 76, "math": 72, "sci": 70, "bio": 68, "phys": 62, "chem": 60, "interests": ["education"], "personality": {"people_oriented": 4.7, "creative": 4.0}},
    "Law": {"khmer": 90, "hist": 88, "geo": 80, "english": 82, "math": 68, "sci": 65, "bio": 62, "phys": 60, "chem": 58, "interests": ["law"], "personality": {"analytical": 4.2, "people_oriented": 4.0}},
    "Tourism & Hospitality": {"english": 88, "khmer": 80, "hist": 75, "geo": 72, "math": 68, "sci": 65, "bio": 65, "phys": 60, "chem": 60, "interests": ["tourism"], "personality": {"people_oriented": 4.5, "creative": 4.3}},
    "Agriculture": {"bio": 82, "sci": 84, "chem": 75, "math": 72, "geo": 78, "khmer": 72, "english": 70, "hist": 70, "phys": 68, "interests": ["agriculture"], "personality": {"analytical": 3.8}},
    "Architecture": {"math": 84, "phys": 80, "khmer": 76, "english": 78, "sci": 74, "hist": 72, "geo": 70, "bio": 65, "chem": 68, "interests": ["arts", "engineering"], "personality": {"creative": 4.8, "analytical": 4.0}},
    "Environmental Science": {"sci": 86, "geo": 82, "bio": 80, "chem": 78, "math": 74, "khmer": 72, "english": 76, "hist": 72, "phys": 70, "interests": ["agriculture"], "personality": {"analytical": 4.0, "creative": 3.8}},
    "Media & Communication": {"english": 90, "khmer": 86, "hist": 78, "geo": 74, "math": 65, "sci": 62, "bio": 60, "phys": 58, "chem": 58, "interests": ["arts"], "personality": {"creative": 4.7, "people_oriented": 4.4}},
    "International Relations": {"english": 92, "khmer": 84, "hist": 86, "geo": 80, "math": 65, "sci": 62, "bio": 60, "phys": 58, "chem": 58, "interests": ["law"], "personality": {"people_oriented": 4.3, "analytical": 4.0}},
}

all_interests = ["technology", "business", "medicine", "education", "arts", "law", "engineering", "agriculture", "tourism"]
traits = ["analytical", "creative", "people_oriented", "detail_oriented"]

rows = []
for major in majors:
    prof = major_profiles[major]
    for _ in range(35):
        # generate scores with noise
        scores = {}
        for subj in ["math", "khmer", "english", "sci", "bio", "hist", "geo", "phys", "chem"]:
            base_score = prof.get(subj, 60)
            score = base_score + np.random.normal(0, 8)
            scores[subj] = max(45.0, min(100.0, score))
            
        stem_avg = (scores["math"] + scores["sci"] + scores["phys"] + scores["chem"]) / 4
        lang_avg = (scores["khmer"] + scores["english"]) / 2
        soc_avg = (scores["hist"] + scores["geo"]) / 2
        top_subj = max(scores.values())

        # budget
        b_rand = random.random()
        b_pub, b_priv, b_schol = 0, 0, 0
        if b_rand < 0.4: b_pub = 1
        elif b_rand < 0.8: b_priv = 1
        else: b_schol = 1
        
        # location
        l_rand = random.random()
        l_pp = 1 if l_rand < 0.45 else 0
        l_prov = 1 - l_pp

        # interests
        ints = {f"interest_{i}": 0 for i in all_interests}
        for i in prof["interests"]:
            ints[f"interest_{i}"] = 1
        for i in all_interests:
            if i not in prof["interests"] and random.random() < 0.2:
                ints[f"interest_{i}"] = 1

        # personality
        pers = {}
        for t in traits:
            base_val = prof["personality"].get(t, 3.0)
            val = base_val + np.random.normal(0, 0.5)
            pers[f"{t}_score"] = max(1.0, min(5.0, val))

        row = {
            "math_score": scores["math"], "khmer_score": scores["khmer"], "english_score": scores["english"],
            "science_score": scores["sci"], "biology_score": scores["bio"], "history_score": scores["hist"],
            "geography_score": scores["geo"], "physics_score": scores["phys"], "chemistry_score": scores["chem"],
            "stem_avg": stem_avg, "language_avg": lang_avg, "social_avg": soc_avg, "top_subject_score": top_subj,
            **ints,
            "budget_public": b_pub, "budget_private": b_priv, "budget_scholarship": b_schol,
            "location_phnom_penh": l_pp, "location_province": l_prov,
            **pers,
            "target_major": major
        }
        rows.append(row)

columns = [
    "math_score", "khmer_score", "english_score", "science_score", "biology_score", "history_score",
    "geography_score", "physics_score", "chemistry_score", "stem_avg", "language_avg", "social_avg",
    "top_subject_score", "interest_technology", "interest_business", "interest_medicine",
    "interest_education", "interest_arts", "interest_law", "interest_engineering",
    "interest_agriculture", "interest_tourism", "budget_public", "budget_private",
    "budget_scholarship", "location_phnom_penh", "location_province", "analytical_score",
    "creative_score", "people_oriented_score", "detail_oriented_score", "target_major"
]

csv_path = "/home/heng/ReanEY/ReanEy/backend/ml/data/training_dataset.csv"
import os
os.makedirs(os.path.dirname(csv_path), exist_ok=True)

with open(csv_path, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=columns)
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} rows at {csv_path}")
