# Logging Standard

## Log Purpose

Log digunakan untuk debugging job, extractor, queue, dan AI workflow.

## Required Job Log Fields

- jobId
- level
- message
- metadataJson
- createdAt

## Log Levels

| Level | Usage |
|---|---|
| DEBUG | Development detail |
| INFO | Normal process |
| WARN | Recoverable problem |
| ERROR | Failed step |

## What to Log

- job created
- job started
- URL resolve method
- product extraction success/failure
- shop extraction success/failure
- weight extraction result
- AI report success/failure
- partial success reason

## What Not to Log

- API keys
- password
- session token
- full private cookie
- raw user secret

## R2 Snapshot Logs

Jika raw data disimpan ke R2, log hanya menyimpan key dan metadata aman.
