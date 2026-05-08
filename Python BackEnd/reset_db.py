import os
import sys
import subprocess
import site
import prisma

# Dynamically find the Scripts directory based on prisma package location
# e.g., site-packages/prisma -> ../../Scripts
prisma_dir = os.path.dirname(prisma.__file__)
site_packages_dir = os.path.dirname(prisma_dir)
scripts_dir = os.path.join(os.path.dirname(site_packages_dir), "Scripts")

# Update environment PATH
env = os.environ.copy()
env["PATH"] = scripts_dir + os.pathsep + env.get("PATH", "")

print("Resetting Database...")
# Skip generate during push to avoid ENOENT, we do it manually next
subprocess.run([sys.executable, "-m", "prisma", "db", "push", "--force-reset", "--skip-generate"], check=True, env=env)

print("Generating Client...")
subprocess.run([sys.executable, "-m", "prisma", "generate"], check=True, env=env)

print("Done!")
