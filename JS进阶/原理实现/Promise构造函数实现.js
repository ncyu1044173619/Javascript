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

  /*内部resolve函数:
    1、更新status为resolved
    2、设置当前Promise的值
    3、执行收集的回调
  */
  resolve(value) {
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

  /*内部resolve函数:
    1、更新status为rejected
    2、设置当前Promise的值
    3、执行收集的回调
  */
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

  /* 1、执行 onResolved 或者 2、执行onRejected 或者 3、收集 onResolved&onRejected；返回PromiseNew对象
    注意：
    一、then必须返回PromiseNew对象，而不是this
      promise2 = promise1.then(function foo(value) {
        return Promise.reject(3)
      })
      假如foo执行的话 -> 代表promise1是resolved
      如果then返回this，即promise1，那么promise2不可能再执行Promise.reject(3)将自身状态改为rejected
    
    二、根据 promise1 的状态确定：执行 onResolved 或者 执行onRejected 或者 收集 onResolved&onRejected
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
  	let self = this;
    let promise2;

    // 根据标准，如果then的参数不是function，则我们需要忽略它，此处以如下方式处理
    onResolved = typeof onResolved === 'function' ? onResolved : function(value) { return value; };
    onRejected = typeof onRejected === 'function' ? onRejected : function(reason) { throw reason; };

    if (self.status === 'resolved') {
      // 返回新的PromiseNew实例
      return promise2 = new PromiseNew(function(resolve, reject) {
        // 因为考虑到 onResolved 函数有可能 throw ，所以将代码放在 try/catch 中
        try {
          /*如果 promise1 的状态确定是resolved，则执行 onResolved，onResolved 执行的结果为 x */
          let x = onResolved(self.data);
          if (x instanceof PromiseNew) {
            /*如果 onResolved 执行的结果是一个 PromiseNew 对象：给 promise2 改状态以及赋值（与x相等）
              1、执行此 x 对象 then 方法上的 onResolved -> 实际是执行 promise2 的 resolve 方法 ->  resolve 的参数是 x 的值，则会将 promise2 的值设置为 x 的值（状态与x一致）
              2、执行此 x 对象 then 方法上的 onRejected -> 实际是执行 promise2 的 reject  方法 ->  reject 的参数是 x 的值， 则会将 promise2 的值设置为 x 的值（状态与x一致）
            */
            // x.then(resolve, reject); // 执行 x 的 then 方法 -> 执行 x 的 onResolved  或者 onRejected -> 执行 promise2 的 resolve 或者 reject
            // 等价于
            if (x.status === 'resolved') {
              resolve(x.data);
            } else if (x.status === 'rejected'){
              reject(x.data);
            } else {
              promise2.status = 'pending';
              promise2.data = undefined;
            }
          } else {
            /*如果 onResolved 执行的结果不是一个 PromiseNew 对象：给 promise2 改状态以及赋值（self.status = 'resolved'; self.data = x;）
              1、onResolved 正确时：promise2 的值为 x ，状态为 resolved
              2、onResolved 出错时：promise2 的值为catch的err，状态为 rejected
            */
            resolve(x);
          } 
        } catch (e) {
          // 给promise2改状态以及赋值: self.status = 'rejected'; self.data = e;
          reject(e);
        }
      });
    }

    if (self.status === 'rejected') {
      // 返回新的PromiseNew实例
      return promise2 = new PromiseNew(function(resolve, reject) {
        try {
          let x = onRejected(self.data);
          if (x instanceof PromiseNew) {
            x.then(resolve, reject);
          } else {
            resolve(x);  
          }
        } catch (e) {
          reject(e);
        }
      });
    }

    /*如果promise1的状态还处于pending状态，我们并不能确定执行onResolved还是onRejected函数
      所以先将其存入回调数组，待状态确定的时候再确定调用哪个函数
    */
    if (self.status === 'pending') {
      // 返回新的PromiseNew实例
      return promise2 = new PromiseNew(function(resolve, reject) {
        // 将 onResolved 存入 onResolvedCallback 数组中
        self.onResolvedCallback.push(function(value) {
          try {
            let x = onResolved(self.data);
            if (x instanceof PromiseNew) {
              x.then(resolve, reject);
            } else {
              resolve(x);
            }
          } catch (e) {
            reject(e);
          }
        });
        // 将 onRejected 存入 onRejectedCallback 数组中
        self.onRejectedCallback.push(function(reason) {
          try {
            let x = onRejected(self.data);
            if (x instanceof PromiseNew) {
              x.then(resolve, reject);
            } else {
              resolve(x);
            }
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }
}


/*连续执行测试：同步resolve*/
let promise1 = new PromiseNew((resolve, reject) => {
  resolve('hello world');
}).then(function(res) {
  console.log(res);
  return new PromiseNew((resolve, reject) => {
    resolve('hello world1');
  });
}).then(function(res) {
  console.log(res);
});
/*连续执行测试：异步resolve*/
let promise2 = new PromiseNew((resolve, reject) => {
  setTimeout(function() {
    alert(1);
    resolve('hello world');
  }, 0);
}).then(function(res) {
  alert(2);
  console.log(res);
  return new PromiseNew((resolve, reject) => {
    alert(3);
    resolve('hello world1');
  });
}).then(function(res) {
  alert(4);
  console.log(res);
});




/*分开执行测试：同步resolve*/
let promise3 = new PromiseNew((resolve, reject) => { // 实例new PromiseNew -> 会执行executor函数 -> 执行内部resolve函数
  resolve('hello world');
});
let promise4 = promise3.then(function(res) { // 执行promise3.then函数 -> 判断promise3的状态 -> 立即执行onResolved函数 或者 收集onResolved
  console.log(res);
  return new PromiseNew((resolve, reject) => {
    resolve('hello world1');
  });
});
let promise5 = promise4.then(function(res) {
  console.log(res);
});
/*分开执行测试：异步resolve*/
let promise6 = new PromiseNew((resolve, reject) => { // 实例new PromiseNew -> 会执行executor函数 -> 执行内部resolve函数
  setTimeout(function() {
    resolve('hello world');
  }, 0);
});
let promise7 = promise6.then(function(res) { // 执行promise3.then函数 -> 判断promise3的状态 -> 立即执行onResolved函数 或者 收集onResolved
  console.log(res);
  return new PromiseNew((resolve, reject) => {
    setTimeout(function() {
      resolve('hello world1');
    }, 0);
  });
});
let promise8 = promise7.then(function(res) {
  console.log(res);
});