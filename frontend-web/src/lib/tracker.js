// OpenReplay session tracking for doctor portal
import Tracker from '@openreplay/tracker';

let tracker = null;

if (typeof window !== 'undefined') {
  tracker = new Tracker({
    projectKey: '6AtDm66GBEPcl7TdCi9K',
  });
  tracker.start();
  tracker.setMetadata('app', 'doctor-portal');
}

export default tracker;
