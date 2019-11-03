// Try running this file with Node

/// @ts-check
const { Observable, interval, timer } = require('rxjs')
const { shareReplayWithDeferredUnsubscribe } = require('../dist')

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

// delay exiting just in case there are unexpected messages
setTimeout(() => {
  // @ts-ignore
  process.exit()
}, 12000)
