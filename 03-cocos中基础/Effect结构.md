# CCEffect 中 `properties` 属性
* 可以在编辑器的材质面板上看到这个属性
* 还有个条件是取决于是否有显示开关
* 在此处声明的属性必须在 CCProgram 声明同名的 uniform 或者指向某个 uniform, 该 uniform 变量也可能被封装到另一个文件之中.  
```
CCEffect %{
    techniques:
    - passes:
      ...
      properties:
        alphaThreshold: { value: 0.5}
}%
```  
* alphaThreshold 透明度阈值, 用户设计给 2D 上使用的纹理大多数都是带有透明通道的, 如不处理的话, 那么这部分的像素就会由纹理自带的像素数据填充, 这通常不是所期望的, 因此我们可以通过该属性在我们需要启用透明测试的时候, 将透明度低于阈值内的片段丢弃,让它呈现透明.  

# include 
* 概念  
>是一种类似于 C 或 C++ 的头文件 include 机制, 你可以在任意的 shader 代码中引入其他代码片段, 所有的头文件都写在后缀名为 `chunk` 的文件中.  
>常见的引入位置有 CCProgram 包裹的地方 或独立的头文件中.  
* chunk 
> Cocos Creator 所有的内置 chunk 都在资源管理器 internal 下的 chunk 文件夹里.  
> 引用内置的 chunk 直接 include chunk 名即可  
```
// 内置头文件引入  #include <chunk-name>
#include <cc-global>
```  
> 对于自定义 chunk 的引用: 采用 include + 文件路径的方式.  
>> 路径查找: 相对于项目目录 assets/chunk 文件夹位置,即使 assets 下没有 chunk 文件夹,也会假设有一个 chunk 文件夹.并相对这个文件夹的路径查找  
>> 路径查找: 相对于当前文件路径查找.
```
#include "../headers/my-shading-algorithm.chunk"
```  

# 宏定义  
* 每一个宏都是一个开关, 默认是编辑状态, 可以在编辑器 或者 运行时开启. 需要通过 if 语句进行判断.  
* 如果不是 GLSL 的内置宏, 不要使用以 `ifdef` 或者 `if defined` 做判断, 否则一直为 true.  
* 以下 `USE_LOCAL` 就是一个宏定义的声明
``` 
#if USE_LOCAL
#include <cc-local>
#endif  

```  
* 宏定义的启用方式有两种:  
> 一种是在材质面板勾选启用宏定义  
> 一种是通过代码获取材质  
```
const meshRenderer = this.getComponent(MeshRenderer);
const mat = meshRenderer.material; 
mat.recompileShaders({ USE_TEXTURE: true })
```  
* `USE_LOCAL` 解释:
> 因为2D大部分图像都是用来做 UI 的, UI 的变化频率很大, 在这假设所有的 UI 都是动态的, 因此需要每一帧检查对象是否需要重新计算. 这时候我们就会在 CPU 中进行模型空间到世界空间的转换.
> 因为后续的转换, 比如说像相机都是比较固定的,  不会每帧变化, 这种坐标放到 GPU 上进行顶点的后续坐标转换就比较合适. 
> 但是这种通用的做法肯定无法满足所有的项目.有些项目的 UI 比较固定变化本来就不大, 因此顶点数据直接提供模型空间的即可, 后续的坐标转换都放在 GPU 上进行, 这样可以减少 CPU 的计算开销.
> 因此提供了这样的一个宏定义. 由用户来决定 2D 顶点数据的计算方式.   
* `USE_PIXEL_ALIGNMENT` 的解释:  
> 就是为了处理像素对齐的, 因为像像素风游戏每个像素的边缘都是很清晰的, 在进行多次坐标转换的时候, 精度差值也会随之增大, 这个时候就容易出现像素抖动的效果.
> 这里的像素对齐就是对观察空间的像素做取整处理, 然后再让他转换到裁剪空间, 这样就能有效的表面像素抖动. 
```
vec4 vert (){
    vec4 pos = vec4(a_position, 1);
    #if USE_LOCAL
      pos = cc_matWorld * pos;
    #endif
    #if USE_PIXEL_ALIGNMENT
      pos = cc_matView * pos;
      pos.xyz = floor(pos.xyz);
      pos = cc_matProj * pos;
    #else
      pos = cc_matViewProj *pos;
    #endif 
}
```  

# layout 讲解  
> 这个部分其实是引擎内部为了做这个严格的内存布局而设定的, 对于用户来说, 根本不需要这么写 `layout(set = 2, binding = 10)`, 直接声明 uniform 来使用即可.  
> 在WebGL讲解中,我们在体积访问输入属性的时候, 需要调用 `gl.getAttribLocation` 获取当前顶点属性的位置, 这个位置默认是由着色器分配, 也可以自己指定. 我们可以通过 gl 的指令 `gl.bindAttribLocation` 按照指定的位置绑定, 然后再采用 `gl.enableVertexAttribArray` 根据位置值激活属性. 
> 当然我们也可以通过 layout 的布局限定符来指定. `layout(location = 2) in vec3 position;` 中的 location 就代表属性要设定的位置, 在两者同时设定的情况下, layout 的优先级更高.
```
#if USE_TEXTURE
  in vec2 uv0;
  #pragma builtin(local)
  layout(set = 2, binding = 10) uniform sampler2D cc_spriteTexture;
#endif
```  

# 在 Cocos Creator 内内置两大数据内存结构,一个是 `CCLocal`, 一个是 `CCGlobal`. 
> 这里的 `#pragma builtin(local)`, 代表申请的是 CCLocal 内存,  layout 的部分代表绑定到 CCLocal 内存指定的位置, 跟 location 类似, 只不过这是 GLSL 更高版本的使用方式. 


# material
```
const mat = new Material();
mat.initialize({ effectAsset: this.effect, defines: { USE_TEXTURE: true}});

const spComp = this.getComponent(Sprite);
spComp.customMaterial = mat;

```


