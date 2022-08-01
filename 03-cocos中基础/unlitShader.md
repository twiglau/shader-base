# unlit shader 是一个经典的最灵活的 shader, 任意效果的 shader;
1. unlit 无光照.
2. 渲染管线有可编程部分: 顶点, 片元
3. Cocos 格式: `Effect` 描述部分, 代码部分

* `Effect`描述部分:
> PASS: 一个完整渲染管线; 一个Shader里面可以多次 `passes`
> SetPassCall: 装载Shader代码到渲染管线
>> vert: 顶点Shader: 代码段名字:入口函数;
>> `builtin header` 内置chunk
>> frag: 片元Shader: 代码段名字:入口函数;
> 游戏线程 -> 传递给Shader数据 -> `properties: &props`; 用户数据通过属性来传递, 只读不可修改;
```
CCEffect %{
    techniques:
    - name: opaque
      passes:
      - vert: general-vs:vert  # builtin header
        frag: unlit-fs:frag
        properties: &props
          mainTexture: { value: white }
          mainColor:   { value: [1, 1, 1, 1], editor: { type: color } }
    - name: transparent
      passes:
      - vert: general-vs:vert # builtin header
        frag: unlit-fs:frag
        blendState:
          targets:
           -blend: true
            blendSrc: src_alpha
            blendDst: one_minus_src_alpha
            blendSrcAlpha: src_alpha
            blendDstAlpha: one_minus_src_alpha
        properties: *props
}%
```  
* 数据来源
1. 引擎传递给Shader的; 特定变量, 矩阵,光源关照放到固定的变量里面;Shader使用是可以访问;
2. 用户传递给Shader的; Properties, uniform 来传递
3. 渲染管线传递给顶点Shader的; 固定的盒子,来存放我们固定的变量;
4. 顶点Shader -> 管道渲染流水线插值处理[ 3个顶点,很多片元-> 片元着色,插值,给我们算好;] -> 传递给着色Shader数据(可控制)
  
* 代码部分
> 顶点着色:
>> 1. 拿到数据 `in vec4 a_color` -> 顶点颜色; `a_position` -> 顶点模型坐标; `a_normal`->法线; `a_tangent` -> 切线;
```
// 获取以上信息
StandardVertInput In;
CCVertInput(In);
```  
>> 2. 改变模型形状,修改模型坐标;
>> 3. 变换坐标: 模型坐标 -> 投影坐标; retrun给 -> 渲染管线;
```
return cc_matProj * (cc_matView * matWorld) * In.position;
```  
>> 4. 传递数据给片元(可控制), 如下:
```
out vec3 v_position;
out vec3 v_normal;
out vec3 v_tangent;
out vec3 v_bitangent;
out vec2 v_uv;
out vec2 v_uv1;
out vec4 v_color;
out float factor_fog;
```  


> 片元着色:
1. 来源于引擎; 光的颜色;
2. 来源于顶点Shader -> 传递给你(插值);
3. 返回颜色数据给 渲染管线 => 目标着色;
4. Properties: 用户CPU传递给我们的数据; [ uniform 类型,名字 | uniform Block块名字 { ... 变量 }] => 定义
```
CCProgram  unlit-fs %{
    precision highp float;
    #include <output>

    in vec2 v_uv;
    uniform sampler2D mainTexture;

    uniform Constant {
        vec4 mainColor;
    };

    vec4 frag () {
      vec4 col = mainColor * texture(mainTexture, v_uv);
      return CCFragOutput(col);
    }
}%
```  

