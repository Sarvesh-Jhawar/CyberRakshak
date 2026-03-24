import os
import subprocess
import sys

def train_all():
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    training_scripts = [
        os.path.join("models", "networking", "src", "networking.py"),
        os.path.join("models", "zero_day_attack", "src", "zero_day_attack.py"),
        os.path.join("models", "malware", "src", "malware_model.py"),
        os.path.join("models", "Ransomware", "src", "ransomware_model.py"),
        os.path.join("models", "phishing", "src", "phishing_model.py")
    ]
    
    for script_rel_path in training_scripts:
        script_path = os.path.join(project_root, script_rel_path)
        script_dir = os.path.dirname(script_path)
        script_name = os.path.basename(script_path)
        
        print("="*60)
        print(f"TRAINING: {script_rel_path}")
        print("="*60)
        
        try:
            # Run the script in its own directory
            result = subprocess.run(
                [sys.executable, script_name],
                cwd=script_dir,
                capture_output=False,
                text=True
            )
            if result.returncode == 0:
                print(f"✅ Successfully trained {script_name}")
            else:
                print(f"❌ Failed to train {script_name} (Exit code: {result.returncode})")
        except Exception as e:
            print(f"❌ Error running {script_name}: {e}")
        print("\n")

if __name__ == "__main__":
    train_all()
