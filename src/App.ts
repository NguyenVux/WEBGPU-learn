
const frameRate = 60;
const FRAME_TIME_MS = 1000 / frameRate; 

const vertices = new Float32Array([
	//   X,    Y,
	  -1, -1,
	   1, -1,
	   1,  1,
	  -1,  1,
]);
const cellShaderModule = {
	label: "Cell shader",
	code: `
	@vertex
	fn vertexMain() {

	}
	`
};
const vertexBufferLayout : GPUVertexBufferLayout = {
	arrayStride: 8,
	attributes: [{
	  format: "float32x2",
	  offset: 0,
	  shaderLocation: 0, // Position, see vertex shader
	}],
      };
export class Application {
	private canvas : HTMLCanvasElement | null;
	private gpuAdapter: GPUAdapter | null;
	private device: GPUDevice | null;
	private lastFrameStamp?: number;

	
	public get GPUDevice() : GPUDevice {
		if(!this.device)
		{
			throw new Error("GPU device is not ready");
		}
		return this.device;
	}
	

	constructor() {
		this.canvas = null;
		this.gpuAdapter = null;
		this.device = null;
	}

	public OnWindowSizeChange()
	{
		if(this.canvas)
		{
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		}
		else {
			console.error("canvas null");
		}
		
	}


	public async OnLoad()
	{
		this.canvas = document.getElementById("app") as HTMLCanvasElement;
		if(this.canvas === null)
		{
			console.error("canvas with id [app] not found");
			return;
		}
		this.OnWindowSizeChange();

		if (!navigator.gpu) {
			throw new Error("WebGPU not supported on this browser.");
		}
		this.gpuAdapter = await navigator.gpu.requestAdapter();
		if (!this.gpuAdapter) {
			throw new Error("No appropriate GPUAdapter found.");
		}
		const abc: string[] = [];

		this.gpuAdapter.features.forEach(element => {
			abc.push(element);
		});
		this.device = await this.gpuAdapter.requestDevice();

		const context = this.canvas.getContext("webgpu") as GPUCanvasContext;
		const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
		context.configure({
		device: this.device,
		format: canvasFormat,
		});


		const encoder = this.device.createCommandEncoder();

		this.device.queue.submit([encoder.finish()]);
		requestAnimationFrame((ts) => this.AnimFrame(ts));
	
	}
	public AnimFrame(timestamp: number) :void {
		if(this.lastFrameStamp === undefined)
		{
			this.lastFrameStamp = timestamp;
		}
		const delta = timestamp - this.lastFrameStamp;
		if(delta > FRAME_TIME_MS)
		{
			this.lastFrameStamp = timestamp;
			this.Update(delta);
		}
		requestAnimationFrame((ts) => this.AnimFrame(ts));
	}

	public Update(delta: number)
	{
		if(this.device === null || this.canvas === null) return;

		const indices = new Int32Array([
			0,1,2,
			2,3,0
		]);
		const vertexBuffer = this.device.createBuffer({
			label: "Cell vertices",
			size: vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
		const indexBuffer = this.device.createBuffer({
			label: "Indices vertices",
			size: indices.byteLength,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		});

		this.device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices,0,vertices.length);
		this.device.queue.writeBuffer(indexBuffer, /*bufferOffset=*/0, indices,0,indices.length);

		const cellShaderModule = this.device.createShaderModule({
			label: 'Cell shader',
			code: `
			struct VertexOut {
				@builtin(position) position : vec4f,
				@location(0) color : vec4f
			};
			@vertex
			fn vertexMain(@location(0) pos: vec2f) ->
			VertexOut {
			var v = VertexOut();
			v.position = vec4f(pos,0,1);
			v.color = v.position/2.0 + vec4f(1,1,1,1);
			return v;
			}
		
			@fragment
			fn fragmentMain(in: VertexOut) -> @location(0) vec4f {
			return in.color;
			}
			`
		});
		const cellPipeline = this.device.createRenderPipeline({
			label: "Cell pipeline",
			layout: "auto",
			vertex: {
			module: cellShaderModule,
			entryPoint: "vertexMain",
			buffers: [vertexBufferLayout]
			},
			fragment: {
			module: cellShaderModule,
			entryPoint: "fragmentMain",
			targets: [{
			format: navigator.gpu.getPreferredCanvasFormat()
			}]
			}
		});
		const context = this.canvas.getContext("webgpu") as GPUCanvasContext;
		const desc : GPURenderPassColorAttachment = {
			view: context.getCurrentTexture().createView(),
			loadOp: "clear",
			clearValue: { r: 0, g: 0, b: 0.0, a: 1 }, // New line
			storeOp: "store",
		};
		const encoder = this.device.createCommandEncoder();
		const pass = encoder.beginRenderPass({
			colorAttachments: [desc] ,
		});

		pass.setPipeline(cellPipeline);
		pass.setVertexBuffer(0, vertexBuffer);
		pass.setIndexBuffer(indexBuffer,"uint32",0);
		// pass.draw(indices.length / 2); // 6 vertices
		pass.drawIndexed(indices.length);
		pass.end();
		this.device.queue.submit([encoder.finish()]);
	}
}