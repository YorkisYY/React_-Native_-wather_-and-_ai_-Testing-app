
export interface WatsonAIConfig {
  baseUrl: string;
  apiKey: string;
  spaceId: string;
}

export interface WatsonAIResponse {
  success: boolean;
  response: string;
  error?: string;
}

export class WatsonAIService {
  private config: WatsonAIConfig;
  private deploymentId: string;
  private accessToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor(config: WatsonAIConfig, deploymentId: string) {
    this.config = config;
    this.deploymentId = deploymentId;
  }

 
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    

    if (this.accessToken && now < this.tokenExpiryTime) {
      console.log('🔄 使用缓存的IAM令牌');
      return this.accessToken;
    }

    console.log('🔑 开始获取IAM令牌...');
    console.log('🔍 API Key 长度:', this.config.apiKey.length);

    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
        'apikey': this.config.apiKey
      }).toString()
    });

    console.log('📡 令牌响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('📄 令牌响应内容:', errorText);
      throw new Error(`Token request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    

    this.accessToken = data.access_token;
    this.tokenExpiryTime = now + (data.expires_in ? (data.expires_in - 300) * 1000 : 50 * 60 * 1000);
    
    console.log('✅ IAM令牌获取成功, 令牌长度:', this.accessToken.length);
    return this.accessToken;
  }


  async sendToAI(text: string): Promise<WatsonAIResponse> {
    try {
      console.log('🎯 调用AI服务部署...');
      console.log('📦 部署 ID:', this.deploymentId);
      console.log('📝 发送文本:', text);

      const accessToken = await this.getAccessToken();
      

      const url = `${this.config.baseUrl}/ml/v4/deployments/${this.deploymentId}/ai_service?version=2021-05-01`;
      
      const requestBody = {
        messages: [
          {
            content: text,
            role: "user"
          }
        ]
      };

      console.log('📤 请求 URL:', url);
      console.log('📝 请求内容:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 响应状态:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.log('📄 响应内容:', responseText);
        
        return {
          success: false,
          response: '',
          error: `AI服务调用失败: ${response.status} - ${responseText}`
        };
      }

      const responseText = await response.text();
      console.log('📄 响应内容:', responseText);
      
      const data = JSON.parse(responseText);
      return this.processAIServiceResponse(data);

    } catch (error) {
      console.error('❌ AI服务调用失败:', error);
      return {
        success: false,
        response: '',
        error: `AI服务调用失败: ${error.message}`
      };
    }
  }


  private processAIServiceResponse(data: any): WatsonAIResponse {
    console.log('✅ AI服务响应成功');

    try {
      let response = '';
      

      if (data.choices && data.choices[0] && data.choices[0].message) {
        response = data.choices[0].message.content;
      } else if (data.result) {
        response = data.result;
      } else if (data.body) {
        if (typeof data.body === 'string') {
          response = data.body;
        } else if (data.body.result) {
          response = data.body.result;
        } else {
          response = JSON.stringify(data.body, null, 2);
        }
      } else if (data.response) {
        response = data.response;
      } else {
        response = JSON.stringify(data, null, 2);
      }

      return {
        success: true,
        response: response.trim()
      };
    } catch (error) {
      return {
        success: false,
        response: '',
        error: `Analyzing: ${error.message}`
      };
    }
  }
}


export async function testWatsonAIFixed() {
  console.log('🔬 Start testing Watson AI connection...');
  
  const config: WatsonAIConfig = {
    baseUrl: 'https://eu-gb.ml.cloud.ibm.com',
    apiKey: process.env.WATSON_API_KEY || 'L8F7g2_YniMc2X_CQL-rbybpNp5LDK80LkuRpbUOotNx',
    spaceId: '7fe633a2-47b0-42e8-8c93-0a7e60aaf007'
  };

  const deploymentId = 'ef2426cc-6550-4f32-8e1a-c091339dc58e';
  const watsonService = new WatsonAIService(config, deploymentId);

  console.log('🏠 space ID:', config.spaceId);
  console.log('📦 deployment ID:', deploymentId);
  console.log('📝 test question: Hello, please introduce yourself.');

  try {
    const result = await watsonService.sendToAI('Hello, please introduce yourself.');
    
    if (result.success) {
      console.log('✅ success!');
      console.log('📢 Watson LLM:', result.response);
      return result;
    } else {
      console.error('❌ failed:', result.error);
      return result;
    }
  } catch (error) {
    console.error('💥 An error occurred during testing:', error);
    return {
      success: false,
      response: '',
      error: error.message
    };
  }
}