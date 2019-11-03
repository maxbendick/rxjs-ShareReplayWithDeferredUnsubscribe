# rxjs-ShareReplayWithDeferredUnsubscribe
`shareReplayWithDeferredUnsubscribe` is an operator for deferred teardown of shared resources.

`shareReplayWithDeferredUnsubscribe` shares its source with a replay of 1. However, when all observers are removed, unsubscription from the source is deferred until an "unsubscribe trigger" emits or completes.

Its only argument, `createUnsubscribeTrigger`, creates an observable that when emitted or completed will cause the operator to unsubscribe from its source. The operator will create and subscribe to the trigger when there are no subscriptions left. The trigger will be unsubscribed if a observer is added.

Try running the follwing example to see it in action:
```javascript

import { Observable, interval, timer } from 'rxjs'
import { shareReplayWithDeferredUnsubscribe } from 'rxjs-sharereplaywithdeferredunsubscribe'

const createUnsubscribeTrigger = () => timer(1000)

const source = new Observable(observer => {
  console.log('source subscribed!')

  const subscription = interval(1000).subscribe(t => {
    console.log('timer emitted', t)
    observer.next(t)
  })

  return () => {
    subscription.unsubscribe()
    console.log('source unsubscribed!')
  }
}).pipe(shareReplayWithDeferredUnsubscribe(createUnsubscribeTrigger))

const subA = source.subscribe(t => console.log('observer a', t))
const subB = source.subscribe(t => console.log('observer b', t))

setTimeout(() => {
  console.log('unsubscribing b')
  subB.unsubscribe()
}, 2500)

setTimeout(() => {
  console.log('unsubscribing a (no more observers)')
  subA.unsubscribe()
}, 3500)

// unsubscribe will be ready to trigger at 4500, but we'll stop it with the following

let subC
setTimeout(() => {
  console.log('subscribing c (first observer back - before teardown trigger)')
  subC = source.subscribe(t => console.log('observer c', t))
}, 4000)

let subD
setTimeout(() => {
  console.log('subscribing d')
  subD = source.subscribe(t => console.log('observer d', t))
}, 4500)

setTimeout(() => {
  console.log('unsubscribing c')
  subC.unsubscribe()
}, 5100)

setTimeout(() => {
  console.log('unsubscribing d')
  subD.unsubscribe()
}, 6100)

setTimeout(() => {
  console.log('this is immediately after source unsubscribed')
}, 7200)

let subE
setTimeout(() => {
  console.log(
    'subscribing c (first observer back - after teardown trigger - timer should reset)',
  )
  subE = source.subscribe(t => console.log('observer e', t))
}, 8000)

setTimeout(() => {
  console.log('unsubscribing e')
  subE.unsubscribe()
}, 9100)

setTimeout(() => {
  console.log('this is immediately after source unsubscribed')
  console.log('done!')
}, 10200)
```

Expect the `error` and `complete` behavior to change in future versions.
