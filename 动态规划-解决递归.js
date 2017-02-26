//动态规划实例：解决斐波那契数列
function recurFib(n){
	if(n<2){
		return n;
	}else{
		return recurFib(n-1)+recurFib(n-2)
	}
}
console.log("斐波那契数列第10位是："+recurFib(10));
for(var i=0;i<=10;i++){
	console.log("斐波那契数列第"+i+"位是:"+recurFib(i));
}

//动态规划解决
function dynFib(n){
	var val=[];
	for(var i=0;i<=n;i++){
		val[i]=0;
	}
	if(n==1||n==2){
		return 1;
	}else{
		val[1]=1;
		val[2]=1;
		for(var i=3;i<=n;i++){
			val[i]=val[i-1]+val[i-2];
		}
		return val[n];
	}
}
console.log("动态规划查找到key是10时候的斐波那契数列value是："+dynFib(10));


//二元一次方程的动态规划：二维数组
function f(m,n){
    var rowarr=[];
    for(var i=1;i<=m;i++){
        var colarr=[];
        for(var j=1;j<=n;j++){
            colarr[j]=0;
        }
        rowarr[i]=colarr;
    }
    if(m==1||n==1){
        return 1;
    }else{
        for(var i=1;i<=m;i++){
            rowarr[i][1]=1;
        }
        for(var j=1;j<=n;j++){
            rowarr[1][j]=1;
        }
        for(var i=2;i<=m;i++){
            for(var j=2;j<=n;j++){
                rowarr[i][j]=rowarr[i-1][j]+rowarr[i][j-1];
            }
        }
        return rowarr[m][n];
    }
}






