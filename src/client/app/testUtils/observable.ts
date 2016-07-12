import { Observable } from 'rxjs';

export interface FakeObservable<T> extends Observable<T> {
  getTimesUsed: () => number;
  resetTimesUsed: () => void;
}
export function createFakeObservable<T>(firstValue: T): FakeObservable<T> {
  let timesUsed = 0;
  const fakeObservable: any = Observable.of(firstValue).do(() => {
    ++timesUsed;
  });
  fakeObservable.getTimesUsed = () => {
    return timesUsed;
  };
  fakeObservable.resetTimesUsed = () => {
    timesUsed = 0;
  };
  return fakeObservable;
}
