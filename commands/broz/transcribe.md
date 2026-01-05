Launch Transcription Process. (Trigger: `broz:transcribe`)

Do this EXACTLY in order:
1) Read `plans/context.yaml` to get `project.path`.
2) Ensure the transcription directory exists: `mkdir -p {project.path}/plans/transcripts`
3) Navigate to the directory: `cd {project.path}/plans/transcripts`
4) Launch the transcription command in the background: `transcribe &`
5) Notify the user that the background process has started in `{project.path}/plans/transcripts`.
