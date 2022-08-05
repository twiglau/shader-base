# 内置PBR Shader 参数详解:
1. 自发光: 
> `USE EMISSIVE MAP` -> `EmissiveMap`: 自发光贴图;
> `Emissive`: 自发光的颜色值;

2. 物体的本色:  
> `USE ALBEDO MAP` -> `Albedo Map`: 物体的本色贴图;

3. 反射:
> 金属度:
>> 数值: `Metallic`
>> 贴图: `USE METALLIC ROUGHNESS MAP` -> `MetallicRoughnessMap` | `USE PBR MAP` -> `PbrMap`
> 粗糙度:
>> 数值: `Roughness`
>> 贴图: `USE METALLIC ROUGHNESS MAP` -> `MetallicRoughnessMap` | `USE PBR MAP` -> `PbrMap`

4. 环境遮挡: 
> `USE OCCLUSION Map` -> `OcclusionMap` : 贴图;
> `Occlusion` -> 遮挡系数;

5. 细节增强: 
> `USE NORMAL MAP` -> `NormalMap`: 法线贴图;

6. cocos实现解释: 
> 文档[https://docs.cocos.com/creator/manual/zh/shader/effect-builtin-pbr.html?h=pbr]