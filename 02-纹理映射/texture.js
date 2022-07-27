function createShader(gl, type, source){
    // 根据 type 创建着色器
    const shader = gl.createShader(type);
    // 绑定内容文本 source
    gl.shaderSource(shader, source);
    // 编译着色器（将文本内容转换成着色器）
    gl.compileShader(shader);
    // 获取编译后的状态
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    // 获取当前着色器相关信息
    console.log(gl.getShaderInfoLog(shader));
    // 删除失败的着色器
    gl.deleteShader(shader);
}

// 创建着色程序 program。gl：WebGL 上下文；vertexShader：顶点着色器对象；fragmentShader：片元着色器对象
function createProgram(gl, vertexShader, fragmentShader){
    // 创建着色程序
    const program = gl.createProgram();
    // 让着色程序获取到顶点着色器
    gl.attachShader(program, vertexShader);
    // 让着色程序获取到片元着色器
    gl.attachShader(program, fragmentShader);
    // 将两个着色器与着色程序进行绑定
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    // 绑定失败则删除着色程序
    gl.deleteProgram(program);
}

function main(){
    const image = new Image();
    image.src = 'http://127.0.0.1:8080/logo.png';
    image.onload = function(){
        render(image);
    }
}

function render(image){
    const canvas = document.createElement('canvas');
    document.getElementsByTagName('body')[0].appendChild(canvas);
    canvas.width = 400;
    canvas.height = 300;
    // 获取 WebGL 上下文（Context），后续统称 gl。
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('There is no gl object');
        return;
    }

    const vertexSource = `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    attribute vec4 a_color;

    varying vec2 v_uv;
    varying vec4 v_color;

    void main(){
        v_uv = a_uv;
        v_color = a_color;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
    `;
    // 根据着色器文本内容，创建 WebGL 上可以使用的着色器对象
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);

    

    // const positions = [
    //     0, 0,
    //     0.7, 0,
    //     0, 0.5,
    //     0.7, 0.5
    // ];
    // 顶点 + uv 
    const vertexPosUv = [
        0, 0, 0, 0,
        0.7, 0, 1, 0,
        0, 0.5, 0, 1,
        0.7, 0.5, 1, 1
    ];

    const colors = [
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,
        255, 127, 0, 255
    ];

    gl.enable(gl.CULL_FACE);

    

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosUv), gl.STATIC_DRAW);
    
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), gl.STATIC_DRAW);

    const indices = [
        0, 1, 2,
        2, 1, 3
    ];

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    const fragmentSource = `
    precision mediump float;

    uniform sampler2D mainTexture;

    varying vec2 v_uv;
    varying vec4 v_color;

    void main (){
        gl_FragColor = texture2D(mainTexture, v_uv) * v_color;
    }
    `;

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // 设置视口尺寸，将视口和画布尺寸同步
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // 清除画布颜色，将它设置成透明色
    // 注意，渲染管线是每帧都会绘制内容，就好比每帧都在画板上画画，如果不清除的话，就有可能出现花屏现象
    gl.clearColor(0, 0, 0, 1);
    // 通过此方法清除的颜色缓冲，所有颜色值为 clearColor 设置的颜色值
    // 通过此方法清除的模板缓冲，所有模板值为 0
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);

    const uvAttributeLocation = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(uvAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 16, 8);


    const colorAttributeLocation = gl.getAttribLocation(program, 'a_color');
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorAttributeLocation, 4, gl.UNSIGNED_BYTE, true, 0, 0);

    // 图像的缓存
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // 图像翻转了, 需要翻转WebGL Y轴,将图片翻转回来
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);


}

main();