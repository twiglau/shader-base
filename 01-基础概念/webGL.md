# WebGL 在GPU上的工作  
1. 将顶点转换到裁剪空间坐标
2. 基于第一点的结果来绘制像素点  

# 顶点着色器和片元着色器在渲染管线流程中的作用  
* 顶点着色器
1. 主要功能: 把顶点坐标转换到裁剪坐标  
2. 接着由GPU通过裁剪与透视剔除法处理后得到了 标准化设备坐标[ NDC ] 
3. 透视剔除法 通过将裁剪空间里顶点的三个分量都除以 w 分量, 来实现裁剪坐标转换到 [ NDC ], NDC 的每一个分量都在 -1~1 之间, 超出部分最终不会呈现. 
4. 在游戏引擎里, 无论使用的是局部坐标还是世界坐标, 都需要经过坐标转换, 最终GPU 会将 NDC 转换成
屏幕坐标传入光栅器.  
5. [NDC]坐标, 顶点数据, 就可以将它作为输入发送给图形渲染管线的第一个阶段: 顶点着色器, 它会在GPU上创建内存用于存储顶点数据,接着再结合顶点组合方式解析这些内存. WebGL 通过顶点缓冲对象 VBO 管理这个内存, VBO它会在GPU的内存中存储大量对象供顶点着色器使用.


# 绘制三角形 
* 多个三角形  
* 绘制不同颜色的三角形   


