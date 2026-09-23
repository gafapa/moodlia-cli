#!/usr/bin/env node
import { reportMoodliaCliError, runMoodliaCli } from './runner.mjs';

runMoodliaCli().catch(reportMoodliaCliError);
