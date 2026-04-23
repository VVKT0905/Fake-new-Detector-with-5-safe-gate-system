import os
import torch
import torch.nn.functional as F
from transformers import AutoModelForSequenceClassification, AutoTokenizer


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = BASE_DIR   


print("MODEL PATH:", MODEL_PATH)


model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH).to(device)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

model.eval()

def predict(text, T=2.5):
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True
    ).to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits

    probs = F.softmax(logits / T, dim=-1)

    real = probs[0][0].item()
    fake = probs[0][1].item()

    if fake > 0.8:
        label = "FAKE"
    elif fake < 0.2:
        label = "REAL"
    else:
        label = "UNCERTAIN"

    return label, real, fake



if __name__ == "__main__":
    test_texts = [
        "Chính phủ vừa công bố tăng lương cơ bản cho người lao động",
        "UFO xuất hiện tại Việt Nam gây chấn động thế giới",
        "Facebook ra mắt tính năng mới hỗ trợ người dùng",
        "Virus bí ẩn biến con người thành zombie ngoài đời thật"
    ]


    print("\n FAKE NEWS MODEL TEST\n")

    for i, text in enumerate(test_texts):
        label, real, fake = predict(text)

        print("==============================")
        print(f"TEST {i+1}")
        print("TEXT :", text)
        print("RESULT:", label)
        print(f"REAL : {real:.4f}")
        print(f"FAKE : {fake:.4f}")