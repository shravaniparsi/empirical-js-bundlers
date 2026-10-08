import fs from 'node:fs';
import crypto from 'node:crypto';

const profile = JSON.parse(fs.readFileSync('benchmark-profile.json'));
const preparation = JSON.parse(fs.readFileSync('adapter-preparation.json'));
const lock = fs.readFileSync('package-lock.json');
const digest = crypto.createHash('sha256').update(lock).digest('hex');
if (profile.publicationEligible !== false || preparation.publicationEligible !== false) throw new Error('Adapter evidence must remain excluded from publication claims');
if (profile.applicationCommit !== preparation.applicationCommit) throw new Error('Profile and prepared source commits differ');
if (profile.lockfileSha256 !== digest) throw new Error(`Lockfile hash mismatch: ${digest}`);
if (profile.tool !== preparation.tool) throw new Error('Prepared tool does not match profile');
console.log(JSON.stringify({ passed: true, tool: profile.tool, applicationCommit: profile.applicationCommit, lockfileSha256: digest }));
