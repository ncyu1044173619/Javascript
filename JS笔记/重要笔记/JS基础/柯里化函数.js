/**
 * 例：实现add(1,2,3)=currying(add)(1)(2)(3)
 *     或者add(1,2,3)=currying(add,1)(2)(3)
 *     或者add(1,2,3)=currying(add,1)(2,3)
 *     或者add(1,2,3)=currying(add,1,2)(3)
 *     或者add(1,2,3)=currying(add,1,2,3)
 */
function add(a,b,c){
  return a+b+c;
}
/*柯里化函数：参数无回调函数*/
function currying(fn) {
    var out = Array.prototype.slice.call(arguments, 1);
    // add(1,2,3)=currying(add,1,2,3)
    if(out.length==3){
        return fn.apply(this, out);
    }
    //add(1,2,3)=currying(add,1,2)(3)
    if(out.length==2){
        return function(){
          var inner1 = Array.prototype.slice.call(arguments);
          return fn.apply(this, out.concat(inner1));
        };
    }
    //add(1,2,3)=currying(add,1)(2,3)或者add(1,2,3)=currying(add,1)(2)(3)
    if(out.length==1){
      return function(){
        var inner1 = Array.prototype.slice.call(arguments);
        //add(1,2,3)=currying(add,1)(2,3)
        if(inner1.length==2){
          return fn.apply(this, out.concat(inner1));
        }
        //add(1,2,3)=currying(add,1)(2)(3)
        if(inner1.length==1){
          return function(){
              var inner2 = inner1.concat(Array.prototype.slice.call(arguments));
              return fn.apply(this, out.concat(inner2));
          };
        }
      };
    }
    //add(1,2,3)=currying(add)(1)(2)(3)
    return function () {
        var inner1 = Array.prototype.slice.call(arguments);
        console.log(inner1);
        return function(){
            var inner2 = inner1.concat(Array.prototype.slice.call(arguments));
            console.log(inner2);
            return function(){
              var inner3 = inner2.concat(Array.prototype.slice.call(arguments));
              console.log(inner3);
              return fn.apply(this, out.concat(inner3));
            };
        };
    };
}
console.log(currying(add)(1)(2)(3));//6
console.log(currying(add,1)(2)(3));//6
console.log(currying(add,1)(2,3));//6
console.log(currying(add,1,2)(3));//6
console.log(currying(add,1,2,3));//6




// ES5版本：参数有回调函数【相当于add(1,2,3)=currying(add)(1)(2)(3)】
var Thunk = function(fn){
  return function (){
    var args = Array.prototype.slice.call(arguments);
    return function (callback){
      args.push(callback);//相当于把参数传给callback了
      return fn.apply(this, args);
    };
  };
};
// ES6版本：参数有回调函数
var Thunk = function(fn) {
  return function (...args) {
    return function (callback) {
      return fn.call(this, ...args, callback);//call传入多参数
    };
  };
};
/*// 使用上面的转换器，生成fs.readFile的 Thunk 函数。
var readFileThunk = Thunk(fs.readFile);
readFileThunk(fileA)(callback);*/
// 下面是另一个完整的例子。
function f(a, cb) {
  cb(a);
}
/* 
let ft = Thunk(f);
let log = console.log.bind(console);//bind绑定到console对象
ft(1)(log); // 1
*/
Thunk(f)(1)(console.log.bind(console));



//再次理解:/闭包/闭包作用及注意点.js
function make_pow(n){
  return function(x){
    return Math.pow(x,n);
  };
}
var pow2=make_pow(2);
console.log(pow2(5));//console.log(make_pow(2)(3))







/**
 * 柯里化函数不指定参数长度的情况
 * ----------------利用递归的方法
 */
function curry(fn) {
    // 去除 fn 之后的参数
    var out = Array.prototype.slice.call(arguments, 1);
    // 去除 fn 之后的参数的长度为 10 的话再执行 fn 函数
    if (out.length >= 10) { 
    	return fn.apply(this, out);
    } else {
      // 返回一个函数：拼接此函数的参数，同时递归调用 curry 函数
    	return function () {
            var inner = Array.prototype.slice.call(arguments);
            return curry.apply(this, [fn].concat(out).concat(inner));
        }
    }
}

function add() {
    var args = Array.prototype.slice.call(arguments);
    return args.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue;
    });
};

console.log(curry(add, 4, 5)(1)(2)(3)(6, 7, 8)(9)(0)); //45
