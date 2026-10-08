/** Pure acceptance rules shared by the M4 executor and its negative controls. */
export function acceptHmrUpdate(observation) {
  const failures = [];
  if (observation.markerObserved !== true) failures.push('updated marker was not observed');
  if (observation.documentPreserved !== true) failures.push('full-page reload detected');
  if (observation.statePreserved !== true) failures.push('application state loss detected');
  if (observation.navigations !== 0) failures.push(`unexpected main-frame navigation count ${observation.navigations}`);
  if (observation.settled !== true) failures.push('post-update settle check failed');
  if (observation.browserErrors !== 0) failures.push(`browser emitted ${observation.browserErrors} error(s)`);
  if (!Number.isFinite(observation.durationMs) || observation.durationMs < 0) failures.push('invalid update duration');
  if (failures.length) throw new Error(failures.join('; '));
  return true;
}

export function acceptReloadDetector(control) {
  if (control.navigationObserved !== true || control.documentReplaced !== true) {
    throw new Error('reload detector failed its positive control');
  }
  return true;
}
