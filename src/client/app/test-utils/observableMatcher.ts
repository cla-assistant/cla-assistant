import { Observable } from 'rxjs/Observable';
import { fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';


export const observableMatchers: any = {
  toComplete: (util) => {
    return {
      compare: (observable: Observable<any>) => {
        const spy = jasmine.createSpy('complete');
        observable.subscribe(null, null, spy);
        tick(1000000000); // Make sure observable has finished
        const result = {
          pass: util.equals(spy.calls.count(), 1),
          message: ''
        };
        if (!result.pass) {
          result.message = 'Expected observable to complete';
        } else {
          result.message = 'Expected observable not to complete';
        }
        return result;
      }
    };
  },
  toEmitValues: (util) => {
    return {
      compare: (observable: Observable<any>, ...values) => {
        const spy = jasmine.createSpy('emit');
        const subscription = observable.subscribe(spy, null);
        tick(100000); // Make sure observable has finished
        // subscription.unsubscribe();
        let rightNumberOfCalls = util.equals(spy.calls.count(), values.length);
        let rightParameters = true;
        let actualParameters = spy.calls.allArgs().map(args => args[0]);
        values.forEach((value, index) => {
          rightParameters = rightParameters
            && spy.calls.argsFor(index).length > 0
            && util.equals(value, spy.calls.argsFor(index)[0]);
        });
        const result = {
          pass: rightNumberOfCalls && rightParameters,
          message: ''
        };
        result.message =
          `Expected observable${result.pass ? ' not ' : ' '}to emit ${jasmine.pp(values)} but got ${jasmine.pp(actualParameters)} .`;
        return result;
      }
    };
  },
  toFailWithError: (util) => {
    return {
      compare: (observable: Observable<any>, ...values) => {
        const spy = jasmine.createSpy('error');
        observable.subscribe(null, spy);
        tick(1000000000); // Make sure observable has finished

        const result = {
          pass: util.equals(spy.calls.allArgs(), [values]),
          message: ''
        };
        if (!result.pass) {
          result.message = 'Expected observable to complete';
        } else {
          result.message = 'Expected observable not to complete';
        }
        return result;
      }
    };
  }
};
