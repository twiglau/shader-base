
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
    const positions = [
        0, 0,
        0, 0.5,
        0.7, 0
    ]
    // 在顶点着色器阶段会在 GPU 上创建内存存储我们的顶点数据
    // 顶点缓存对象就是为了管理这内存, 它会在GPU内存中存储大量
    // 的顶点.
    // 使用这个缓冲对象的好处: 我们可以一次性的发送一大批数据到显卡上,
    // 而不是每个顶点发送一次, 从CPU把数据发送到GPU这个过程是比较慢的,
    // 
    const vertexBuffer = gl.createBuffer();
    // 可以绑定多个buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 初始化数据存储
    // 参数2: buffer数据存储区的大小, 为顶点位置分配字节数:
    // 每个顶点分量都是浮点型, 一般针对浮点性数据也都采用32位字节存储
    // 参数3: 提示WebGL该怎么使用这些数据:
    // -> 1. gl.STATIC_DRAW: 数据不会或几乎不会改变;
    // -> 2. gl.DYNAMIC_DRAW: 数据会被改变很多;
    // -> 3. gl.STREAM_DRAW: 数据每次绘制时都会改变;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

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

    // 当前WebGL 还不知道该如何解析内存中的顶点数据  
    // 也就是如何将顶点数据 链接到顶点着色器的属性上, 我们需要告诉
    // WebGL 怎么做?
    // 顶点着色器有个特性: 就是允许指定任何以顶点属性为形式的输入.
    // 即一个顶点可以包含多个属性, 比如这里的位置属性;
    // 这种形式的输入为我们在数据组织上提供了很大的灵活性.
    // 因为这里只有一个定性属性, 所以一个 float 32 位的顶点
    // 缓冲会被解析成这个样子:
    // 图: 01
    // 每个顶点位置包含两个位置分量
    // 由于缓冲采用的是 float 32 位浮点型数组, 一个字节是8位,
    // 因此 一个分量占4个字节, 一个顶点属性占8个字节.
    // 1. offset 代表当前输入数据在一个顶点数据里的偏移;由于这个顶点数据里只有
    // position, 因此偏移量为 0, 如果后续还有顶点颜色, 纹理坐标等等.那么就需要
    // 根据数据结构选取合适的偏移量, 偏移量采用数据偏移长度 x 字节数的形式提供.
    // 2. stride  代表一个顶点数据总的字节长度, 计算方式为顶点数据长度x字节数

    // 解析顶点数据
    // 1. 先设置一下视口
    // 方便在屏幕映射时将 NDC 坐标转换为屏幕坐标;
    // 屏幕映射得到的屏幕坐标决定了这个顶点对应屏幕上那个像素.
    // 最终这些值都会交给 光栅器处理
    // 2. 同时还要清除画布颜色 和 颜色缓冲
    // 由于最终呈现在屏幕上的颜色都要从颜色缓冲中读取
    // 因此每次绘制的时候都要清除, 否则容易出现花屏现象.
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1); // 黑色
    gl.clear(gl.COLOR_BUFFER_BIT); // 容易出现花屏.


    // 启用着色程序
    // 每次绘制之前都要启用指定的着色程序
    gl.useProgram(program);

    // 获取顶点位置属性 在顶点着色器中的位置索引
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    // 这个索引好引用到 GPU 维护的属性列表中 arrayBuffter 上
    gl.enableVertexAttribArray(positionAttributeLocation);
    // 以确保当前 ARRAYBUFFER 使用的缓冲是我要的顶点缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 接着告诉属性如何获取数据
    // 参数的含义:
    // 1.index        代表获取顶点着色器上指定属性的位置.
    // 2.size         代表当前一个顶点数据要取的数据长度
    // 3.type         数据缓冲类型
    // 4.normalized   决定数据是否要归一化. 提供的就是裁剪坐标,所以不归一化.
    // 5.stride       代表数据存储的方式, 单位是字节, 0表示数据是连续存放的,通常是只有一个数据时,这么用.
    // 如果, 我们当前提交的顶点数据只有顶点位置.
    // 非0则表示同一个属性在数据总的间隔大小. 可以理解为 步长
    // 6.offset        表示的属性在缓冲区中每间隔的偏移值. 单位是字节.
    gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );
    // 接下来 进行渲染
    // 最后的参数: 绘制几个顶点
    gl.drawArrays(gl.TRIANGLES, 0, 3);

}

main();