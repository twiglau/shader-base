
function createShader(gl, type, source){
    // 创建顶点着色器
    const shader = gl.createShader(type);
    // 关联文本
    gl.shaderSource(shader, source);
    // 编译着色器
    gl.compileShader(shader);
    // 判断编译状态
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success){
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}
// 创建着色程序
function createProgram(gl, vertexShader, fragmentShader){
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const sucess = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(sucess){
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteShader(program);
}
function main(){
    // 通过 canvas 获取上下文
    const canvas = document.createElement('canvas');
    document.getElementsByTagName('body')[0].appendChild(canvas);
    canvas.width = 400;
    canvas.height = 300;

    // 获取绘图上下文 gl
    const gl = canvas.getContext('webgl');
    if(!gl){
        console.log('There is no gl Object');
        return;
    }

    // 编辑顶点着色器
    const vertexSource = `
    attribute vec2 a_position; // 接收一个顶点位置输入

    void main(){
        // 然后将顶点位置传递给 gl 内置变量 gl_Position
        // 没有深度 z = 0.0;
        // w 分量设置为 1.0;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
    `
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    // 定义顶点数据
    // 以下位置,会产生一个矩形, 但有两个重复的数据,会产生额外的开销,
    /**
     * const positions = [
        0, 0,
        0, 0.5,
        0.7, 0,
        0, 0.5,
        0.7, 0.5,
        0.7, 0
    ]

     如果场景很庞大, 问题就会越来越严重.
     因此, 可以采用的解决方案是提供 最优顶点:  
     之后,只要指定绘制的顺序就可以了.
     我们把指定绘制顺序的方法称为 顶点索引.
     对应了 WebGL 上的索引缓冲对象 index buffer object, 简称 IBO.

     索引缓冲对象?
     将多余的数据对象移除掉后, 剩下4个顶点. 标记出它们的数据索引.
     图 02
     如图所示: 有了索引之后, 就可以清晰地定义出两个三角形.
     > 第一个三角形的顶点数据 取顶点索引: 0, 1, 2
     > 第二个三角形 去顶点索引: 2, 1, 3
     将数据提交给 WebGL 索引缓冲对象, WebGL 就会按照索引顺序绘制顶点
     注意: 
     提交的顶点索引需要按照逆时针顺序提交, 这是因为一个物体通常有两个面,
     一个面,是面向我们的, 一个面是看不见的. 如果两个都绘制无疑是一个浪费,
     因此, WebGL 会主动提出背面, 留下正面. 这样在数据提交上就必须有一套
     规则: 默认情况下 逆时针定义的三角形为正面.
     */
    const positions = [
        0, 0,
        0.7, 0,
        0, 0.5,
        0.7, 0.5
    ];

    // 1. 启用:  剔除背面
    gl.enable(gl.CULL_FACE);
   
    const vertexBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // 2. 定义顶点索引, 以逆时针的方式定义:
    const indices = [
        0, 1, 2,
        2, 1, 3
    ]

    // 3. 建立索引缓存对象
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // 索引值既没有小数点,也不可能是负数. 用 unit 来存就可以了.
    // 少的话,用 uint8, 多的话, 用 uint16, 再往上,可能WebGL 并不支持.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    // 片元着色器
    const fragmentSource = `
    precision mediump float;

    void main(){
        // rgba 255, 0, 127, 255
        gl_FragColor = vec4(1, 0, 0.5, 1.0);
    }
    `;
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    // 创建着色程序
    const program = createProgram(gl, vertexShader, fragmentShader);

    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1); // 黑色
    gl.clear(gl.COLOR_BUFFER_BIT); // 容易出现花屏.


    // 启用着色程序
    gl.useProgram(program);

    // 获取顶点位置属性 在顶点着色器中的位置索引
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    // 这个索引好引用到 GPU 维护的属性列表中 arrayBuffter 上
    gl.enableVertexAttribArray(positionAttributeLocation);
    // 以确保当前 ARRAYBUFFER 使用的缓冲是我要的顶点缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 接着告诉属性如何获取数据
    gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );
    // 4. 接下来 进行渲染
    // gl.drawArrays(gl.TRIANGLES, 0, 6);
    // 参数3: 元素数组缓冲区中值的类型 - 在WebGL1 中有两个类型:
    // > gl.UNSIGNED_BYTE: 支持的最大索引值为 255.
    // > gl.UNSIGNED_SHORT: 最大索引值为 65535
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);


}

main();