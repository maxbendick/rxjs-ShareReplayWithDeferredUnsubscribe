import { Observable } from 'rxjs';
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
export declare const shareReplayWithDeferredUnsubscribe: <A>(createUnsubscribeTrigger: () => Observable<any>) => (source: Observable<A>) => Observable<A>;
