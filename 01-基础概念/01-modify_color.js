
/**
 * 
 * 运行时, 动态修改颜色
 * 动态的设置输入的接口?  
 * > 一种是采用 uniform 的方式
 * > 还有一种是通过扩展顶点属性的方式设置
 * 
 * uniform 是一种从 CPU 中的应用向 GPU 中的着色器发送数据的方式.
 * 但 uniform 和 顶点属性有点不同, uniform 是全局的, 意味着每一个
 * uniform 变量在每个着色器程序中它是独一无二的. 可以被着色器程序的任意
 * 着色器,在任意阶段访问. 并且 uniform 会始终保持它自身的值, 除非它被重置
 * 或者更新.
 * 
 * 在片源着色器上定义一个颜色 uniform. 用来接收我们传入的颜色值.
 * 
 * 
 * 如果希望不同的顶点, 采用不同的颜色, 以上方法就不会满足.
 * WebGL 中可以获得顶点着色器中输入的三个颜色值,在光栅化的时候,根据这三个值
 * 进行插值, 也就是说 如果三角形每个顶点的颜色都不一样, 那么 WebGL 会在顶点a
 * 和顶点 b 直接进行像素插值,
 * 
 *  所以接下来我们需要给顶点着色器传顶点颜色值, 让它根据我们给定的值进行颜色绘制.
 * 
 * 方式2 虽然为每个顶点提供了颜色, 但是整体的画面, 可以看出颜色跟颜色之间产生了过渡,
 * 这其实就是在之前说的片段着色器会进行所谓的 [片段插值].
 * 渲染一个三角形时, 光栅化阶段通常会造成比原始指定顶点更多的片段, 光栅化阶段会根据
 * 每个片段在三角形形状上所处相对位置,决定这个片段的位置, 然后再根据这个位置对所有的
 * 片段着色器的输入变量进行插值.  
 * 
 * 补充问题: 
 * 如果对内存有一定了解的同学, 可能会对顶点数据这一块有问题, 毕竟位置这一块用 float 的
 * 数值来记录没什么问题, 但是 color 需要吗?  
 * 答:  毕竟 color 的每一个分量范围都是 0~255, 1个字节的存储就够了, 根本不需要用到 4 个字节,
 * 一个 float 就可以存储 rgba 四个分量了, 因此, 这里需要进行一些改造,方法有两种:
 * > 方法一: 创建一个大的缓冲, 让 position 和 color 共享这个缓冲.
 * > 方法二: 新增一个缓冲, 让 positions 和 colors 不共享同一个缓冲.
 */

function createShader(gl, type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success){
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}
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
    const canvas = document.createElement('canvas');
    document.getElementsByTagName('body')[0].appendChild(canvas);
    canvas.width = 400;
    canvas.height = 300;
    const gl = canvas.getContext('webgl');
    if(!gl){
        console.log('There is no gl Object');
        return;
    }
    const vertexSource = `
    attribute vec2 a_position;
    attribute vec4 a_color; // 方式二: 顶点着色器, 新增顶点颜色输入.
    varying vec4 v_color ; // 方式二: 同时,增加输出,传递给片源着色器.

    void main(){
        v_color = a_color;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
    `
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    // 方式二: 修改顶点数据: 位置 + 颜色
    // const vertexData = [
    //     0, 0, 1, 0, 0, 1,
    //     0.7, 0, 0, 1, 0, 1,
    //     0, 0.5, 0, 0, 1, 1,
    //     0.7, 0.5, 1, 0.5, 0, 1
    // ];

    // 内存解决方式一:
    const positions = [
        0, 0, 
        0.7, 0, 
        0, 0.5, 
        0.7, 0.5
    ];
    const colors = [
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,
        255, 127, 0, 255
    ]


    // 方式一: 位置
    // const positions = [
    //     0, 0,
    //     0.7, 0,
    //     0, 0.5,
    //     0.7, 0.5
    // ];
    gl.enable(gl.CULL_FACE);

    // 内存解决方式一:
    // color 用 uint8 就够了, 因此, 要让 uint8 和 float32 都能指向同一段缓冲的缓冲类型.
    // 该类型就是 ArrayBuffer.
    // ArrayBuffer 是用来表示通用的固定长度的原始二进制数据缓冲区, 它是一个字节数组
    // const arrayBuffer = new ArrayBuffer(positions.length * Float32Array.BYTES_PER_ELEMENT + colors.length);
    // const positionBuffer = new Float32Array(arrayBuffer);
    // const colorBuffer = new Uint8Array(arrayBuffer);

    // 1. 存数据
    // i+2 => 一个位置数据, 有两个分量.
    // 位置的两个分量 占 两个 float, 然后颜色的是每个分量它的范围都是 0~255,
    // 因此颜色的4个分量 总的占 1个 float.
    // 
    // let offset = 0;
    // for(let i=0; i < positions.length;i += 2){
    //     positionBuffer[offset] = positions[i];
    //     positionBuffer[offset + 1] = positions[i+1];
    //     offset += 3;
    // }
    // offset = 8; // 两个float
    // for(let j=0; j < colors.length;j += 4){
    //     colorBuffer[offset] = positions[j];
    //     colorBuffer[offset + 1] = positions[j+1];
    //     colorBuffer[offset + 2] = positions[j+2];
    //     colorBuffer[offset + 3] = positions[j+3];
    //     // 一个stride, 2 个 position 的 float, 加 4 个 uint8, 2x4 + 4 = 12
    //     offset += 12;
    // }
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    // gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colorBuffer), gl.STATIC_DRAW);


    const indices = [
        0, 1, 2,
        2, 1, 3
    ]
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    const fragmentSource = `
    precision mediump float;
    // uniform vec4 u_color; // 方式一: 通过定义 uniform 的方式
    // 接收来自顶点着色器的颜色属性
    varying vec4 v_color;

    void main(){
        //gl_FragColor = u_color; // 方式一
        gl_FragColor = v_color; // 方式二
    }
    `;
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1); // 黑色
    gl.clear(gl.COLOR_BUFFER_BIT); // 容易出现花屏.
    gl.useProgram(program);
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 方式二: 获取颜色属性的索引值
    const colorAttributeLocation = gl.getAttribLocation(program, 'a_color');
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // 位置属性
    gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        8,// 12 24 一个顶点 3个float
        0
    );
    // 颜色属性
    gl.vertexAttribPointer(
        colorAttributeLocation,
        4,
        gl.UNSIGNED_BYTE, //FLOAT
        true, // false color数据是 255,不再是 float, 解析时,需要规画 处理.
        8, // 24
        0
    );
    // 方式一: 通过定义 uniform 的方式
    // 获取到 uniform 的索引值
    // const vertexColorLocation = gl.getUniformLocation(program, 'u_color');
    // 给 uniform 赋值: gl.uniform 加后缀的方式:
    // 如图 03.
    // i,
    // gl.uniform4f(vertexColorLocation, 0, 0, 1, 1);
    // ii, 数组形式
    // gl.uniform4fv(vertexColorLocation, [Math.random(), Math.random(), Math.random(), 1]);


    // 4. 接下来 进行渲染
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    

}

main();