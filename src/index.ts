import { Observable, Observer, ReplaySubject, Subscription } from 'rxjs'
import { filter, share } from 'rxjs/operators'

const nil = Symbol('nil')

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
export const shareReplayWithDeferredUnsubscribe = <A>(
  createUnsubscribeTrigger: () => Observable<any>,
) => (source: Observable<A>): Observable<A> => {
  let triggerSubscription: Subscription = null
  let sourceSubscription: Subscription = null
  let completed = false
  let errored = false
  let error: any = undefined

  // relays from source to observers
  const subject = new ReplaySubject<A | typeof nil>(1)
  const subjectWithoutNil = subject.pipe(filter(a => a !== nil)) as Observable<
    A
  >

  const teardownTrigger = () => {
    if (triggerSubscription) {
      triggerSubscription.unsubscribe()
      triggerSubscription = null
    }
  }

  const teardownAll = () => {
    if (sourceSubscription) {
      sourceSubscription.unsubscribe()
      sourceSubscription = null
    }

    teardownTrigger()

    // Remove the reference the ReplaySubject has to the
    // previous data for garbage collection
    subject.next(nil)
  }

  const sourceObserver: Observer<A> = {
    next: (a: A) => {
      subject.next(a)
    },
    error: (e: any) => {
      errored = true
      error = e
      teardownAll()
      subject.error(e)
    },
    complete: () => {
      completed = true
      teardownAll()
      subject.complete()
    },
  }

  const triggerObserver: Observer<A> = {
    next: () => teardownAll(),
    error: e => {
      console.error('Unable to handle error from unsubscribe trigger', e)
    },
    complete: () => teardownAll(),
  }

  const startTrigger = () => {
    if (triggerSubscription) {
      throw new Error('Existing triggerSubscription. This should not happen.')
    }

    triggerSubscription = createUnsubscribeTrigger().subscribe(triggerObserver)
  }

  return new Observable<A>(observer => {
    // Trigger hasn't emitted when an observer has been added, so cancel the trigger
    if (triggerSubscription) {
      teardownTrigger()
    }

    // Source has already errored, so relay that and do no more
    if (errored) {
      observer.error(error)
      return
    }

    // Source has already completed, so relay that and do no more
    if (completed) {
      observer.complete()
      return
    }

    // The observer listens to the replayed subject
    subjectWithoutNil.subscribe(observer)

    if (!sourceSubscription) {
      sourceSubscription = source.subscribe(sourceObserver)
    }

    return () => {
      startTrigger()
    }
  }).pipe(
    // `share` multicasts for consumers and allows us to deal with
    // 0 or 1 observers instead of many observers
    share(),
  )
}
