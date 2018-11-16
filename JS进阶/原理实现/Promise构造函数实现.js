/**
 * 参考地址：https://github.com/xieranmaya/blog/issues/3
 */
class PromiseNew {
	/*resolver为 function(resolve, reject){ ... }：主要是写resolve函数和reject函数*/
  constructor(executor) {
  	// 初始状态为pending
    this.status = 'pending';
    // Promise的值
    this.data = undefined;
    // then成功回调注册函数
    this.onResolvedCallback = [];
    // then失败回调注册函数
    this.onRejectedCallback = [];
    /*考虑到执行executor的过程中有可能出错，所以用try/catch块给包起来，并且在出错后以catch到的值reject掉这个Promise*/
    try {
      /*executor是形参 -> 实例PromiseNew的时候会执行executor的参数 -> 执行内部resolve方法*/
      executor(this.resolve.bind(this), this.reject.bind(this)) 
    } catch(e) {
      this.reject(e)
    }
  }

  /*更新status为：resolved，并且执行成功处理队列*/
  resolve(value) {
    debugger; // 2
    let self = this;
    if (self.status === 'pending') {
      self.status = 'resolved';
      self.data = value;
      // 这里面实际是收集了then函数中的回调
      for(let i = 0; i < self.onResolvedCallback.length; i++) {
        self.onResolvedCallback[i](value)
      }
    }
  }

  /*更新status为：rejected，并且执行失败处理队列*/
  reject(reason) {
    let self = this;
    if (self.status === 'pending') {
      self.status = 'rejected';
      self.data = reason;
      for(var i = 0; i < self.onRejectedCallback.length; i++) {
        self.onRejectedCallback[i](reason)
      }
    }
  }

  /*同时注册成功和失败处理函数
    一、then必须返回PromiseNew对象，而不是this
      promise2 = promise1.then(function foo(value) {
        return Promise.reject(3)
      })
      假如foo执行的话 -> 代表promise1是resolved
      如果then返回this，即promise1，那么promise2不可能再执行Promise.reject(3)将自身状态改为rejected
    
    二、根据 promise1 的状态确定执行 onResolved 或者 onRejected
      promise2 = promise1.then(function(value) {
        return 4
      }, function(reason) {
        throw new Error('sth went wrong')
      })
      如果promise1被resolve了，此时promise1状态为resolved，promise2的将被4 resolve，
      如果promise1被reject了，此时promise1状态为rejected，promise2将被new Error('sth went wrong') reject

      所以，我们需要在then里面执行onResolved或者onRejected，并根据返回值来确定promise2的结果，
      并且，如果onResolved/onRejected返回的是一个Promise，promise2将直接取这个Promise的结果。
  */
  then(onResolved, onRejected) {
    debugger; // 1
  	let self = this;
    let promise2;

    // 根据标准，如果then的参数不是function，则我们需要忽略它，此处以如下方式处理
    onResolved = typeof onResolved === 'function' ? onResolved : function(v) {}
    onRejected = typeof onRejected === 'function' ? onRejected : function(r) {}

    if (self.status === 'resolved') {
      // 返回新的PromiseNew实例
      return promise2 = new PromiseNew(function(resolve, reject) {
        // 因为考虑到onResolved函数有可能throw，所以将代码放在try/catch中
        try {
          /*如果promise1的状态确定是resolved，则执行onResolved，onResolved执行的结果为x*/
          let x = onResolved(self.data);
          /*如果onResolved执行的结果是一个PromiseNew对象：
            1、x的状态未知，取决于实际返回的PromiseNew对象
            2、x调用then方法
          */
          if (x instanceof PromiseNew) {
            x.then(resolve, reject);
          }
          /*如果onResolved执行的结果不是一个Promise对象：
            1、onResolved正确时：promise2的值为x，状态为resolved
            2、onResolved出错时：promise2的值为catch的err，状态为rejected
          */
          // 给promise2改状态以及赋值: self.status = 'resolved'; self.data = x;
          resolve(x);
        } catch (e) {
          // 给promise2改状态以及赋值: self.status = 'rejected'; self.data = e;
          reject(e);
        }
      });
    }

    if (self.status === 'rejected') {
      return promise2 = new PromiseNew(function(resolve, reject) {
        try {
          let x = onRejected(self.data);
          if (x instanceof PromiseNew) {
            x.then(resolve, reject);
          }
        } catch (e) {
          reject(e);
        }
      });
    }

    if (self.status === 'pending') {
      // 返回新的PromiseNew实例
      return promise2 = new PromiseNew(function(resolve, reject) {
        /*如果promise1的状态还处于pending状态，我们并不能确定执行onResolved还是onRejected函数
          所以先将其存入回调数组，待状态确定的时候再确定调用哪个函数
        */
        self.onResolvedCallback.push(function(value) {
          try {
            let x = onResolved(self.data);
            if (x instanceof PromiseNew) {
              x.then(resolve, reject);
            }
          } catch (e) {
            reject(e);
          }
        });
        self.onRejectedCallback.push(function(reason) {
          try {
            let x = onRejected(self.data);
            if (x instanceof PromiseNew) {
              x.then(resolve, reject);
            }
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }
}

/*实例new PromiseNew：
  会执行executor函数 -> 执行内部resolve函数
*/
let promise1 = new PromiseNew((resolve, reject) => {
  setTimeout(function() {
    resolve('hello world');
  }, 0);
  // resolve('hello world');
  // reject('you are err');
});

/*执行promise1.then函数 ->
  判断promise1的状态 ->
  根据promise1的状态确定是否立即执行onResolved函数（并不是立即执行onResolved）
*/
let promise2 = promise1.then(function(res) {
  debugger; // 3
	console.log(res);
  return new PromiseNew((resolve, reject) => {
    setTimeout(function() {
      resolve('hello world1');
    }, 0);
    // resolve('hello world');
    // reject('you are err');
  });
});

let promise3 = promise2.then(function(res) {
  console.log(res);
});