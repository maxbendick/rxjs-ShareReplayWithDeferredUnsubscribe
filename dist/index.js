"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var nil = Symbol('nil');
/**
 * An operator for deferred garbage collection of shared resources.
 *
 * Shares the source with a replay of 1. However, when all observers
 *   are removed, unsubscription from the source is deferred until the
 *   result of `createUnsubscribeTrigger` emits or completes.
 *
 * @param createUnsubscribeTrigger Creates an observable that when
 *   emitted or completed will cause `shareReplayWithDeferredUnsubscribe`
 *   to unsubscribe from `source`. The operator will create and
 *   subscribe to trigger the when there are no subscriptions left.
 *   The trigger will be unsubscribed if a observer is added.
 *
 * There may be changes to error and completion behavior
 */
exports.shareReplayWithDeferredUnsubscribe = function (createUnsubscribeTrigger) { return function (source) {
    var triggerSubscription = null;
    var sourceSubscription = null;
    var completed = false;
    var errored = false;
    var error = undefined;
    // relays from source to observers
    var subject = new rxjs_1.ReplaySubject(1);
    var subjectWithoutNil = subject.pipe(operators_1.filter(function (a) { return a !== nil; }));
    var teardownTrigger = function () {
        if (triggerSubscription) {
            triggerSubscription.unsubscribe();
            triggerSubscription = null;
        }
    };
    var teardownAll = function () {
        if (sourceSubscription) {
            sourceSubscription.unsubscribe();
            sourceSubscription = null;
        }
        teardownTrigger();
        // Remove the reference the ReplaySubject has to the
        // previous data for garbage collection
        subject.next(nil);
    };
    var sourceObserver = {
        next: function (a) {
            subject.next(a);
        },
        error: function (e) {
            errored = true;
            error = e;
            teardownAll();
            subject.error(e);
        },
        complete: function () {
            completed = true;
            teardownAll();
            subject.complete();
        }
    };
    var triggerObserver = {
        next: function () { return teardownAll(); },
        error: function (e) {
            console.error('Unable to handle error from unsubscribe trigger', e);
        },
        complete: function () { return teardownAll(); }
    };
    var startTrigger = function () {
        if (triggerSubscription) {
            throw new Error('Existing triggerSubscription. This should not happen.');
        }
        triggerSubscription = createUnsubscribeTrigger().subscribe(triggerObserver);
    };
    return new rxjs_1.Observable(function (observer) {
        // Trigger hasn't emitted when an observer has been added, so cancel the trigger
        if (triggerSubscription) {
            teardownTrigger();
        }
        // Source has already errored, so relay that and do no more
        if (errored) {
            observer.error(error);
            return;
        }
        // Source has already completed, so relay that and do no more
        if (completed) {
            observer.complete();
            return;
        }
        // The observer listens to the replayed subject
        subjectWithoutNil.subscribe(observer);
        if (!sourceSubscription) {
            sourceSubscription = source.subscribe(sourceObserver);
        }
        return function () {
            startTrigger();
        };
    }).pipe(
    // `share` multicasts for consumers and allows us to deal with
    // 0 or 1 observers instead of many observers
    operators_1.share());
}; };
