我将这两个 PDF 文件转换为了 Markdown 格式，内容已合并为一份文档，保留了两份 API 接口说明的完整示例和参数信息。

---

# OpenAI Response API 使用说明 & Google Gemini OpenAI 兼容接口

## 第一部分：OpenAI Response API 使用说明

### 简介

OpenAI Response API 是 OpenAI 最先进的用于生成模型响应的接口。支持文本和图像输入，以及文本输出。可通过将先前响应的输出作为输入，与模型创建有状态的交互。借助内置工具（如文件搜索、网页搜索、计算机使用等）扩展模型能力。还可通过函数调用让模型访问外部系统与数据。

本文介绍了常用方法，详情请参考 OpenAI 官方文档。

### 支持模型

- `gpt-4o`
- `gpt-4o-mini`
- `gpt4.1` 系列
- `gpt5` 系列
- `gpt5.1` 系列
- `gpt` 后续的系列

### 使用用法

```
POST https://api.ppinfra.com/openai/v1/responses
```

提供文本或图像输入，以生成文本或 JSON 输出。可让模型调用你自定义的代码，或使用网页搜索、文件搜索等内置工具，将你自己的数据作为输入来生成模型响应。

### 示例：基本请求

**请求**

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": "hello"
  }'
```

**响应**

```json
{
  "id": "resp_19f1c3617DWFsbG1uLWf6dXJLLTIXYWxsalW4tYXp1cmUtODM5Mi1vcGVuYWk3cmVzcF8wY2FiY2RmNGIzZTdhYWm3MDA2OTVkZGMYNWEOMDQ4MTkwOTU0OTIxNzQwMDU2YWY4OAVncHQtNQ",
  "object": "response",
  "created_at": 1767758885,
  "status": "completed",
  "background": false,
  "content_filters": null,
  "error": null,
  "incomplete_details": null,
  "instructions": null,
  "max_output_tokens": null,
  "max_tool_calls": null,
  "model": "pa/gpt-5",
  "output": [
    {
      "id": "rs_0cabcd4b3e7aac700695ddc26aa508190831e2ebe4dcb8c63",
      "type": "reasoning",
      "summary": []
    },
    {
      "id": "msg_0cabcd4b3e7aac700695ddc26c6508190b2445d79448c3384",
      "type": "message",
      "status": "completed",
      "content": [
        {
          "type": "output_text",
          "annotations": [],
          "logprobs": [],
          "text": "Hi there! How can I help you today?"
        }
      ],
      "role": "assistant"
    }
  ],
  "parallel_tool_calls": true,
  "previous_response_id": null,
  "prompt_cache_key": null,
  "prompt_cache_retention": null,
  "reasoning": {
    "effort": "medium",
    "summary": null
  },
  "safety_identifier": null,
  "service_tier": "default",
  "store": true,
  "temperature": 1.0,
  "text": {
    "format": {
      "type": "text"
    },
    "verbosity": "medium"
  },
  "tool_choice": "auto",
  "tools": [],
  "top_logprobs": 0,
  "top_p": 1.0,
  "truncation": "disabled",
  "usage": {
    "input_tokens": 7,
    "input_tokens_details": {
      "cached_tokens": 0
    },
    "output_tokens": 16,
    "output_tokens_details": {
      "reasoning_tokens": 0
    },
    "total_tokens": 23
  },
  "user": null,
  "metadata": {}
}
```

### 示例：带角色的文本输入

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": [
      {
        "role": "system",
        "content": "you are a smart assistant"
      },
      {
        "role": "user",
        "content": "hello"
      }
    ]
  }'
```

### 示例：带角色、类型的输入

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": [
      {
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": "hello"
          }
        ]
      }
    ]
  }'
```

### 示例：图片输入

**支持的图片格式**：`.png`、`.jpeg`、`.jpg`、`.webp`、`.gif`、`base64`

**大小限制**：每次请求的总负载大小最多 50MB，每次请求最多 500 个单独的图像输入

**其他要求**：无水印或标志，不含 NSFW 内容，清晰可辨，足以让人类理解

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": [
      {
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": "discribe this pic"
          },
          {
            "type": "input_image",
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
          }
        }
      }
    ]
  }'
```

### 示例：PDF 输入

支持 PDF 链接或 base64 编码

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": [
      {
        "role": "user",
        "content": [
          {
            "type": "input_text",
            "text": "what is the file mean?"
          },
          {
            "type": "input_file",
            "file_url": "https://arxiv.org/pdf/1706.03762v7"
          }
        ]
      }
    ]
  }'
```

### 示例：输出结构化 JSON

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": "把下面这条用户信息整理成 JSON: 姓名=张三, 生日=1998-02-14, 邮箱=zs@example.com。只输出 JSON, 不要输出其它内容。",
    "text": {
      "format": {
        "name": "user_profile",
        "type": "json_schema",
        "schema": {
          "type": "object",
          "properties": {
            "name": { "type": "string", "description": "用户姓名" },
            "birthdate": { "type": "string", "description": "生日, YYYY-MM-DD" },
            "email": { "type": "string", "description": "邮箱地址" }
          },
          "required": ["name", "birthdate", "email"],
          "additionalProperties": false
        }
      }
    }
  }'
```

### 示例：工具调用

**网页搜索工具**

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": "introduce the Beijing city",
    "tools": [
      {
        "type": "web_search"
      }
    ]
  }'
```

**MCP 工具**

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": "简单描述一下天空为什么是蓝色的",
    "tools": [
      {
        "type": "mcp",
        "server_label": "deepwiki",
        "server_url": "https://mcp.deepwiki.com/mcp"
      }
    ]
  }'
```

> 其他用法请参考 OpenAI 官方文档

### 示例：流式输出

```bash
curl https://api.ppinfra.com/openai/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_xxxxxxxxxxxxxxxxxx" \
  -d '{
    "model": "pa/gpt-5",
    "input": "introduce the Beijing city",
    "stream": true
  }'
```

### 示例：控制推理强度

```bash
curl -X POST \
  'https://api.ppinfra.com/openai/v1/responses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxxxxxxxxx' \
  -d '{
    "model": "pa/gpt-5",
    "reasoning": {"effort": "high"},
    "input": "天空为什么是蓝色的"
  }'
```

### 常用参数说明


| 参数名                    | 类型              | 必填  | 默认值   | 说明                                                                                                                                                                                                                                               |
| ---------------------- | --------------- | --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `model`                | string          | 是   | \     | 用于生成响应的模型 ID，例如 `pa/gpt-5`、`pa/gpt-5.2-pro`。                                                                                                                                                                                                     |
| `input`                | string 或 array  | 是   | \     | 提供给模型的输入（文本、图像或文件），用于生成响应。                                                                                                                                                                                                                       |
| `instructions`         | string          | 否   | \     | 插入到模型上下文中的 system（或 developer）消息。与 `previous_response_id` 同用时：上一条响应中的 instructions 不会自动继承到下一条，便于在新请求中替换 system/developer 指令。                                                                                                                     |
| `previous_response_id` | string          | 否   | \     | 上一条响应的唯一 ID，用于构建多轮对话（会话状态）。不能与 `conversation` 同时使用。                                                                                                                                                                                              |
| `text`                 | object          | 否   | \     | 配置模型的文本响应选项，可输出纯文本或结构化 JSON 数据。                                                                                                                                                                                                                  |
| `max_output_tokens`    | integer         | 否   | \     | 限制本次响应最多可生成的 token 数上限（包含可输出 token 与推理 token）。                                                                                                                                                                                                   |
| `temperature`          | number          | 否   | 1     | 采样温度，范围 0～2。值越高越随机（如 0.8），越低越稳定聚焦（如 0.2）。一般建议只调整 `temperature` 或 `top_p` 其中一个，不要同时调整。                                                                                                                                                            |
| `top_p`                | number          | 否   | 1     | 核采样（nucleus sampling）。模型只在累计概率质量为 top_p 的候选 token 中采样，例如 0.1 表示仅考虑概率质量最高的 10%。一般建议只调整 `top_p` 或 `temperature` 其中一个。                                                                                                                              |
| `tools`                | array           | 否   | \     | 模型生成响应时可调用的工具列表。可配合 `tool_choice` 指定使用哪个工具。支持：①内置工具：如 web search、file search 等；②MCP 工具：通过自定义 MCP server 或预置连接器（如 Google Drive、SharePoint）集成第三方系统；③函数调用/自定义工具：你定义的函数，让模型以强类型参数/输出调用你的代码。                                                          |
| `tool_choice`          | string 或 object | 否   | \     | 指定模型在生成响应时如何选择要调用的工具（或多个工具）。                                                                                                                                                                                                                     |
| `stream`               | boolean         | 否   | false | 为 true 时，模型响应数据会在生成过程中通过服务器发送事件（Server-Sent Events，SSE）实时流式传输给客户端。                                                                                                                                                                               |
| `reasoning`            | object          | 否   | \     | 包含以下子参数： • `effort`：string，非必填，默认值：`medium`。限制推理模型在"推理"上投入的强度/努力程度。当前支持：`none`、`minimal`、`low`、`medium`、`high`、`xhigh`。降低推理强度通常会带来更快的响应速度，并减少响应中用于推理的 token 消耗。 • `summary`：string，非必填。模型推理过程的摘要，可用于调试和理解模型的推理过程。取值：`auto`、`concise`、`detailed`。 |


### 使用限制

目前仅支持 POST 接口，不支持状态存储，在请求体中设置 `response_id` 不保证状态串联。

---

## 第二部分：Google Gemini OpenAI 兼容接口

### 1. 基本用法

#### 示例：最小可运行请求

```bash
curl -X POST \
  "https://{api_domain}/openai/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H 'Authorization: Bearer sk_xxxx' \
  -d '{
    "model": "pa/gmn-2.5-fls",
    "stream": false,
    "messages": [
      {
        "role": "user",
        "content": "你是谁"
      }
    ]
  }'
```

#### 示例：控制思考长度

`thinking_budget` 参数：

- `gmn-2.5-fls` 最低可以设置为 0
- `gmn-2.5-pr` 最低只能是 128
- `include_thoughts`：是否显示 thinking 内容

```bash
curl -X POST \
  'https://{api_domain}/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxxx' \
  -d '{
    "model": "pa/gmn-2.5-pr",
    "stream": true,
    "messages": [
      {
        "role": "user",
        "content": "你是谁"
      }
    ],
    "extra_body": {
      "google": {
        "thinking_config": {
          "include_thoughts": false,
          "thinking_budget": 128
        }
      }
    }
  }'
```

#### 示例：Gemini 3 thinking level

对于 Gemini 3，可以使用 `thinking_level` 控制思考，可选参数为 `low`、`medium`、`high`。

> 如果在 Gemini 3 模型的同一个请求中同时指定 `thinking_level` 和 `thinking_budget`，则该模型会返回错误。

```bash
curl -X POST \
  'https://{api_domain}/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxxx' \
  -d '{
    "model": "pa/gemini-3-pro-preview",
    "stream": false,
    "messages": [
      {
        "role": "user",
        "content": "你是谁"
      }
    ],
    "extra_body": {
      "google": {
        "thinking_config": {
          "thinking_level": "low"
        }
      }
    }
  }'
```

#### 典型响应

```json
{
  "id": "47c27f7cf25a5abc4260b65fc5a0fe1b",
  "object": "chat.completion",
  "created": 1764990814206,
  "model": "pa/gm-2.5-pr",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "我是一个大型语言模型，由 Google 训练"
      }
    }
  ]
}
```

### 2. 高级特性

Gemini API 提供多项增强能力，用于改善性能、准确性以及生成控制能力：

### 2.1 Prompt cache

#### 隐式缓存

```bash
curl --location --request POST 'https://api.ppinfra.com/openai/v1/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk_xxxxxxxxs' \
  --data-raw '{
    "model": "pa/gmn-2.5-fls",
    "max_tokens": 1000,
    "messages": [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": "你是狂人日记的研究者，以下是狂人日记的片段，以供参考。"
          },
          {
            "type": "text",
            "text": "某君昆仲，今隐其名..."
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "狂人是谁?"
          }
        ]
      }
    ]
  }'
```

#### 显式缓存

Gemini 的显式 cache，在 OpenAI 兼容接口下使用 `cache_control` 来触发：

```bash
curl --location --request POST 'https://api.ppinfra.com/openai/v1/chat/completions' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk_xxxxx' \
  --data-raw '{
    "model": "pa/gmn-2.5-fls",
    "max_tokens": 1000,
    "messages": [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": "你是狂人日记的研究者，以下是狂人日记的片段，以供参考。"
          },
          {
            "type": "text",
            "text": "某君昆仲，今隐其名...",
            "cache_control": {
              "type": "ephemeral"
            }
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "狂人是谁?"
          }
        ]
      }
    ]
  }'
```

**返回示例**

```json
{
  "id": "1ac4fd3e29caa2f555dbe0d8294af4ca",
  "object": "chat.completion",
  "created": 1767512930639,
  "model": "pa/gmn-2.5-fls",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "根据《狂人日记》的文本，\"狂人\"指的是日记的作者..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 4680,
    "completion_tokens": 380,
    "total_tokens": 5060,
    "prompt_tokens_details": {
      "audio_tokens": 0,
      "cached_tokens": 4677,
      "cache_creation_input_tokens": 4677,
      "cache_read_input_tokens": 0,
      "text_tokens": 0,
      "image_tokens": 0,
      "video_tokens": 0
    },
    "completion_tokens_details": {
      "audio_tokens": 0,
      "reasoning_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0,
      "text_tokens": 0,
      "image_tokens": 0,
      "video_tokens": 0
    }
  },
  "system_fingerprint": ""
}
```

### 2.2 推理强度控制

> **注意**：gemini 2.5 pro 不能彻底关闭；`reasoning_effort` 设置为 `disable` 或者 `none` 时，也会有少量的 reasoning_tokens 的消耗。


| reasoning_effort      | thinking 说明                                    |
| --------------------- | ---------------------------------------------- |
| `"disable"`, `"none"` | `"budget_tokens": 0`                           |
| `"low"`               | `"budget_tokens": 1024`；最大消耗 1024 个 token 用于思考 |
| `"medium"`            | `"budget_tokens": 2048`；最大消耗 2048 个 token 用于思考 |
| `"high"`              | `"budget_tokens": 4096`；最大消耗 4096 个 token 用于思考 |


```bash
curl -X POST \
  'https://api.pipnfra.com/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxxx' \
  -d '{
    "model": "pa/gmn-2.5-fls",
    "stream": false,
    "messages": [
      {
        "role": "user",
        "content": "介绍一下 Google Gemini."
      }
    ],
    "reasoning_effort": "disable"
  }'
```

#### thinking_budget

- `gmn-2.5-fls` 最低可以设置为 0
- `gmn-2.5-pr` 最低只能是 128，无法彻底关闭
- `include_thoughts`：控制是否返回 thinking 内容

```bash
curl -X POST \
  'https://api.domain/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxxx' \
  -d '{
    "model": "pa/gmn-2.5-fls",
    "stream": false,
    "messages": [
      {
        "role": "user",
        "content": "你是谁"
      }
    ],
    "extra_body": {
      "google": {
        "thinking_config": {
          "include_thoughts": false,
          "thinking_budget": 0
        }
      }
    }
  }'
```

#### thinking_level

Gemini 3 模型引入了 `thinkingLevel` 参数，将思维预算配置简化为多个级别。默认情况下，Gemini 3 Pro 使用动态思维来处理提示。如果不需要复杂的推理，则可以限制模型的 `thinkingLevel` 以获得更快、更低延迟的响应。

对于 Gemini 3，可以使用 `thinking_level` 控制思考，可选参数为 `low`、`medium`、`high`。

> 如果在 Gemini 3 模型的同一个请求中同时指定 `thinkingLevel` 和 `thinkingBudget`，则该模型会返回错误。

```bash
curl -X POST \
  'https://{api_domain}/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxxx' \
  -d '{
    "model": "pa/gemini-3-pro-preview",
    "stream": false,
    "messages": [
      {
        "role": "user",
        "content": "你是谁"
      }
    ],
    "extra_body": {
      "google": {
        "thinking_config": {
          "thinking_level": "low"
        }
      }
    }
  }'
```

### 2.3 Google Search

依托 Google Search 可将 Gemini 模型与实时网络内容相关联，并支持所有可用语言。这样一来，Gemini 就可以提供更准确的回答，并引用知识截止日期之后的可验证来源。

```bash
curl -X POST \
  'https://api.pipnfra.com/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxx' \
  -d '{
    "model": "pa/gmn-2.5-pr",
    "stream": false,
    "messages": [
      {
        "role": "user",
        "content": "列一下今天中国的热点新闻"
      }
    ],
    "reasoning_effort": "disable",
    "tools": [
      {
        "function": {"name": "google_search"}
      }
    ]
  }'
```

**结果示例**

OpenAI 协议可从非标准字段 `gemini_grounding_metadata` 获取 Grounding 信息。

```json
{
  "id": "dcc7eab10b5adeb9e8648d134e815409",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here are some of today's top news in China: ..."
      },
      "finish_reason": "stop"
    }
  ],
  "gemini_grounding_metadata": {
    "webSearchQueries": [
      "中国今日热点新闻"
    ],
    "groundingChunks": [
      "..."
    ]
  }
}
```

### 2.4 Code Execution

Gemini 提供了一个代码执行工具，可让模型生成和运行 Python 代码。然后，模型可以根据代码执行结果进行迭代学习，直到获得最终输出。

```bash
curl -X POST \
  'https://api.ppinfra.com/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxxx' \
  -d '{
    "model": "pa/gmn-2.5-fls",
    "stream": false,
    "messages": [
      {
        "role": "user",
        "content": "What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50."
      }
    ],
    "extra_body": {
      "google": {
        "thinking_config": {
          "include_thoughts": false,
          "thinking_budget": 0
        }
      }
    },
    "tools": [
      {
        "function": {"name": "code_execution"}
      }
    ]
  }'
```

**结果示例**

对于 OpenAI 协议，代码和代码执行结果将在 content 中体现。

```python
def is_prime(num):
    """Checks if a number is prime."""
    if num <= 1:
        return False
    if num <= 3:
        return True
    if num % 2 == 0 or num % 3 == 0:
        return False
    i = 5
    while i * i <= num:
        if num % i == 0 or num % (i + 2) == 0:
            return False
        i += 6
    return True

def get_first_n_primes(n):
    """Generates a list of the first n prime numbers."""
    primes = []
    num = 2
    while len(primes) < n:
        if is_prime(num):
            primes.append(num)
        num += 1
    return primes

# Get the first 50 prime numbers
first_50_primes = get_first_n_primes(50)

# Calculate the sum of these prime numbers
sum_of_primes = sum(first_50_primes)

print(f"The first 50 prime numbers are: {first_50_primes}")
print(f"The sum of the first 50 prime numbers is: {sum_of_primes}")
```

输出：

- The first 50 prime numbers are: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229]
- The sum of the first 50 prime numbers is: **5117**

### 2.5 URL Context

借助 URL context 工具，您可以网址的形式向模型提供更多上下文。通过在请求中添加网址，模型将访问这些网页中的内容，从而为回答提供信息并提高回答质量。

```bash
curl -X POST \
  'https://api.ppinfra.com/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxx' \
  -d '{
    "model": "pa/gmn-2.5-fls",
    "stream": false,
    "messages": [
      {
        "role": "user",
        "content": "这份食谱适合什么人士 https://www.foodnetwork.com/recipes/ina-garten/perfect-roast-chicken-recipe-1940592"
      }
    ],
    "reasoning_effort": "low",
    "tools": [
      {
        "function": {"name": "url_context"}
      }
    ]
  }'
```

### 2.6 视频输入

**可支持的视频类型**：
`video/x-flv`, `video/quicktime`, `video/mpeg`, `video/mpegs`, `video/mpg`, `video/mp4`, `video/webm`, `video/wmv`, `video/3gpp`

```bash
curl --location --request POST 'https://api.novita.ai/v3/openai/v1/chat/completions' \
  --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk_tRxxxxxxx_-QdP4' \
  --header 'Accept: */*' \
  --header 'Host: api.novita.ai' \
  --header 'Connection: keep-alive' \
  --data-raw '{
    "model": "pa/gemini-3-pro-preview",
    "messages": [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": "You are a helpful assistant."
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "video_url",
            "video_url": {
              "url": "https://s3.pilw.io/examples/multimedia/video1.mp4",
              "format": "video/mp4"
            }
          },
          {
            "type": "text",
            "text": "这段视频的内容是什么?"
          }
        ]
      }
    ]
  }'
```

### 2.7 音频输入

**可支持的音频类型**：
`audio/x-aac`, `audio/flac`, `audio/mp3`, `audio/m4a`, `audio/mpeg`, `audio/mpga`, `audio/mp4`, `audio/ogg`, `audio/pcm`, `audio/wav`, `audio/webm`

**format: "audio/ogg"**

```bash
curl --location --request POST 'https://api.novita.ai/v3/openai/v1/chat/completions' \
  --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk_ttRxxxxxxx_-QdP4' \
  --header 'Accept: */*' \
  --header 'Host: api.novita.ai' \
  --header 'Connection: keep-alive' \
  --data-raw '{
    "model": "pa/gemini-3-pro-preview",
    "messages": [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": "你是一个乐于助人的人，用中文回答。"
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "input_audio",
            "input_audio": {
              "data": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg",
              "format": "audio/ogg"
            }
          },
          {
            "type": "text",
            "text": "这段audio的内容是什么?"
          }
        ]
      }
    ]
  }'
```

**format: "audio/mp3"**

```bash
curl --location --request POST 'https://api.novita.ai/v3/openai/v1/chat/completions' \
  --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer sk_tRxxxxxxx_-QdP4' \
  --header 'Accept: */*' \
  --header 'Host: api.novita.ai' \
  --header 'Connection: keep-alive' \
  --data-raw '{
    "model": "pa/gemini-3-pro-preview",
    "messages": [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": "你是一个乐于助人的人，用中文回答。"
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "input_audio",
            "input_audio": {
              "data": "https://raw.githubusercontent.com/naer-cpu/my-audio-files/main/test_audio.mp3",
              "format": "audio/mp3"
            }
          },
          {
            "type": "text",
            "text": "这段audio的内容是什么?"
          }
        ]
      }
    ]
  }'
```

### 2.8 图片输入

**Supported MIME types**: `image/png`, `image/jpeg`, `image/webp`, `image/heic`, `image/heif`

```bash
curl -X POST \
  'https://api.pipnfra.com/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxx' \
  -d '{
    "model": "pa/gemini-3-pro-preview",
    "max_tokens": 300,
    "stream": false,
    "messages": [
      {
        "role": "system",
        "content": "你是 AI 助手，你会以诚实专业的态度帮助用户，用中文。"
      },
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "请描述图像内容。"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://ljw-yzu.oss-cn-beijing.aliyuncs.com/25xt-128308-HappyKidsJumpingIllustration2.png",
              "format": "image/png"
            }
          }
        ]
      }
    ]
  }'
```

**使用 Google Cloud Storage 地址的图片**

```bash
curl -X POST 'https://api.ppinfra.com/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sk_xxxxxxxxxx' \
  -d '{
    "model": "pa/gemini-3-flash-preview",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "Describe this image briefly"},
          {"type": "image_url", "image_url": {"url": "gs://cloud-samples-data/vision/demo-img.jpg"}}
        ]
      }
    ],
    "stream": false,
    "max_tokens": 100
  }'
```

