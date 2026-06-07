请根据readme.md生成一个模型表单编辑页面, 

## 模板指标说明
说明如下:
```markdown
| 字段名          | 描述                   | 是否必填 | 数据类型      |
|-----------------|------------------------|---------|--------------|
| id             | ID                    | false   | string       |
| isFixed        | 是否为固定值 0:是 1:否 | false   | integer(int32) |
| level          | 指标层级               | false   | integer(int32) |
| metricCategory | 指标类别 0:填报 1:计算 | false   | integer(int32) |
| metricCode     | 指标编码               | false   | string       |
| metricName     | 模板指标名称           | false   | string       |
| modelCode      | 模型编码               | false   | string       |
| pageCode       | 模型页面编码           | false   | string       |
| pmetricCode    |  父指标编码             | false   | string       |
| unit           | 单位                   | false   | string       |
| versionCode    | 版本编码               | false   | string       |
```

## 功能要求
注: 参考: 模板指标说明
### 1. 根据“查询所有模型与指标配置表(mock数据)”对应的接口获取到数据, 以element-plus表格组件生成表格.
#### 1.1 表格头
表格头数据: ['序号', '指标名称', '指标编码', '指标类别', '固定值', '指标层级', '单位', '模型编码', '模型页面编码', '版本编码', '操作']
#### 1.2 表格体
表格体中对应列"固定值": 是否为固定值 0:是,1:否
表格体中对应列"指标类别": 指标类别: 0: 填报,1:计算;

---


可以添加内容如下: 
1. 指标名称(metricName)
2. 指标

pmetricCode


## “查询所有模型与指标配置表(mock数据)”
接口路由: /economodel/modelmetric/list

接口post参数:
```
{
"modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
"pageCode": "101018602857037825",
"versionCode": "0"
}
```

接口返回数据:
```
{
  "success": true,
  "code": "200",
  "message": "success",
  "type": "data",
  "data": [
    {
      "opUser": "",
      "sort": 3,
      "delFlag": 0,
      "id": "A91F1B8FA8BE423C830DEFB2C7DD886C",
      "metricName": "半干面生鲜面粉",
      "level": 3,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001QD0001100003",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300001QD0001999999"
    },
    {
      "opUser": "",
      "sort": 4,
      "delFlag": 0,
      "id": "19BDA3ED80BC464189F7AA8763238D78",
      "metricName": "馒头富强粉 ",
      "level": 3,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001QD0001100009",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300001QD0001999999"
    },
    {
      "opUser": "",
      "sort": 14,
      "delFlag": 0,
      "id": "9BBDCE4B6F5241C8A6AF3C8D149868C3",
      "metricName": "馒头富强粉 ",
      "level": 3,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002QD0001100009",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300002QD0001999999"
    },
    {
      "opUser": "",
      "sort": 6,
      "delFlag": 0,
      "id": "6BB0FDAB070548F1A3E6D751220479F7",
      "metricName": "香雪油条粉、面条粉",
      "level": 3,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001QD0002100010",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300001QD0002999999"
    },
    {
      "opUser": "",
      "sort": 17,
      "delFlag": 0,
      "id": "B8A4638BCE5744F6878FA7AB02457261",
      "metricName": "速冻食品专用粉、品牌粉",
      "level": 3,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002QD0002100002",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300002QD0002999999"
    },
    {
      "opUser": "",
      "sort": 7,
      "delFlag": 0,
      "id": "A27285D1132D473AB06B53A758888EAC",
      "metricName": "速冻食品专用粉、品牌粉",
      "level": 3,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001QD0002100002",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300001QD0002999999"
    },
    {
      "opUser": "",
      "sort": 1,
      "delFlag": 0,
      "id": "3AA0ADFA35934FC2921EDA2795329188",
      "metricName": "标的销量",
      "level": 1,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001999999999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "0"
    },
    {
      "opUser": "",
      "sort": 2,
      "delFlag": 0,
      "id": "B10721CEEA3E4450B319A1245C4C927A",
      "metricName": "食品工业",
      "level": 2,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001QD0001999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300001999999999999"
    },
    {
      "opUser": "",
      "sort": 16,
      "delFlag": 0,
      "id": "DB7D6D332EFC42E0B2228D1032798FD5",
      "metricName": "香雪油条粉、面条粉",
      "level": 3,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002QD0002100010",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300002QD0002999999"
    },
    {
      "opUser": "",
      "sort": 5,
      "delFlag": 0,
      "id": "A71592080D5143999D962E71D9183F9D",
      "metricName": "餐饮渠道",
      "level": 2,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001QD0002999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300001999999999999"
    },
    {
      "opUser": "",
      "sort": 27,
      "delFlag": 0,
      "id": "98230C3FCE564A5EBC0318A13E5FAEAA",
      "metricName": "速冻食品专用粉、品牌粉",
      "level": 3,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003QD0002100002",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300003QD0002999999"
    },
    {
      "opUser": "",
      "sort": 29,
      "delFlag": 0,
      "id": "23144419BDB0433AB7B91892D76DC43C",
      "metricName": "超级金橘粉",
      "level": 3,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003QD0003100007",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300003QD0003999999"
    },
    {
      "opUser": "",
      "sort": 32,
      "delFlag": 0,
      "id": "0D76CEC209DB489BA16B67042CCE3E87",
      "metricName": "其他收入",
      "level": 1,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "F300002999999999999",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "0"
    },
    {
      "opUser": "",
      "sort": 11,
      "delFlag": 0,
      "id": "C3B5008A524D4AE89CCB23A095D2DF7A",
      "metricName": "标的售价（不含税）",
      "level": 1,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002999999999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "0"
    },
    {
      "opUser": "",
      "sort": 12,
      "delFlag": 0,
      "id": "114573CD6EB44BF58204B97641971B34",
      "metricName": "食品工业",
      "level": 2,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002QD0001999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300002999999999999"
    },
    {
      "opUser": "",
      "sort": 15,
      "delFlag": 0,
      "id": "BF6BA3E8B4174C7697F1D85BB05FBD40",
      "metricName": "餐饮渠道",
      "level": 2,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002QD0002999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300002999999999999"
    },
    {
      "opUser": "",
      "sort": 18,
      "delFlag": 0,
      "id": "5361204ED7D94B728217FA704607CDC2",
      "metricName": "大客户",
      "level": 2,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002QD0003999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300002999999999999"
    },
    {
      "opUser": "",
      "sort": 22,
      "delFlag": 0,
      "id": "9BF15E6461AD4DC89D791143E50856FF",
      "metricName": "食品工业",
      "level": 2,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003QD0001999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300003999999999999"
    },
    {
      "opUser": "",
      "sort": 25,
      "delFlag": 0,
      "id": "9FC5084CB58B4D96BAB7E90D905A2A0C",
      "metricName": "餐饮渠道",
      "level": 2,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003QD0002999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300003999999999999"
    },
    {
      "opUser": "",
      "sort": 28,
      "delFlag": 0,
      "id": "DCF525D76749497EB03B43053E22B739",
      "metricName": "大客户",
      "level": 2,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003QD0003999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300003999999999999"
    },
    {
      "opUser": "",
      "sort": 31,
      "delFlag": 0,
      "id": "395AEEA5E7874EA7AD7DB49F6123AED6",
      "metricName": "补贴收入",
      "level": 1,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "F300001999999999999",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "0"
    },
    {
      "opUser": "",
      "sort": 21,
      "delFlag": 0,
      "id": "CACD7BA5E44D46D18948EDF2791738D8",
      "metricName": "标的销额（不含税）",
      "level": 1,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003999999999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "0"
    },
    {
      "opUser": "",
      "sort": 13,
      "delFlag": 0,
      "id": "FAB7D32119374C8583D8FE528794F3D1",
      "metricName": "半干面生鲜面粉",
      "level": 3,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002QD0001100003",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300002QD0001999999"
    },
    {
      "opUser": "",
      "sort": 8,
      "delFlag": 0,
      "id": "3AB4584728054553907157136CF9E4A9",
      "metricName": "大客户",
      "level": 2,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001QD0003999999",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300001999999999999"
    },
    {
      "opUser": "",
      "sort": 9,
      "delFlag": 0,
      "id": "C1DD9954A30743448887F21A086B1C85",
      "metricName": "超级金橘粉",
      "level": 3,
      "isFixed": 0,
      "unit": "吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300001QD0003100007",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300001QD0003999999"
    },
    {
      "opUser": "",
      "sort": 19,
      "delFlag": 0,
      "id": "45F1F31B460247F98E5FFC9DE90A3411",
      "metricName": "超级金橘粉",
      "level": 3,
      "isFixed": 0,
      "unit": "元/吨",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300002QD0003100007",
      "pageCode": "101018602857037825",
      "metricCategory": 0,
      "pmetricCode": "P300002QD0003999999"
    },
    {
      "opUser": "",
      "sort": 23,
      "delFlag": 0,
      "id": "79751B19572442728A0BA40DA3BF26EE",
      "metricName": "半干面生鲜面粉",
      "level": 3,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003QD0001100003",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300003QD0001999999"
    },
    {
      "opUser": "",
      "sort": 24,
      "delFlag": 0,
      "id": "6DC13756CD6F4F0B8FEE27F70EDFF50C",
      "metricName": "馒头富强粉 ",
      "level": 3,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003QD0001100009",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300003QD0001999999"
    },
    {
      "opUser": "",
      "sort": 26,
      "delFlag": 0,
      "id": "58AA47ECD47D49B9AAA24E6A7DA9318E",
      "metricName": "香雪油条粉、面条粉",
      "level": 3,
      "isFixed": 0,
      "unit": "元",
      "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
      "versionCode": "0",
      "metricCode": "P300003QD0002100010",
      "pageCode": "101018602857037825",
      "metricCategory": 1,
      "pmetricCode": "P300003QD0002999999"
    }
  ]
}
```
