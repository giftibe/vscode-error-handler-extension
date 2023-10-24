const vscode = require('vscode');
const { spawn } = require('child_process');
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { PromptTemplate } = require("langchain/prompts");
require('dotenv').config({ path: __dirname + '/.env' })


const APIKey = process.env.OPENAI_API_KEY

const chat = new ChatOpenAI({
	openAIApiKey: APIKey,
});


/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log(' "gpt-errors", Terminal Error Detection Extension is now active.');

	const child = spawn('node', ['index.js']);
	let terminalOutput = '';

	// Listen for data on the terminal's stdout
	child.stdout.on('data', async (data) => {
		terminalOutput = data.toString();

		if (terminalOutput.includes('error') || terminalOutput.includes('Error') || terminalOutput.includes('exception')) {
			try {
				const errorData = terminalOutput;
				const response = await processError(errorData);
				console.log('Response from OpenAI:', response);
				displayResponseInTerminal(response);

			} catch (error) {
				console.log('Error creating solution', error);
				vscode.window.showErrorMessage('Error analyzing and handling error: ' + error.message);
			}
		}
	});


	async function processError(errorData) {
		try {
			console.log("here now")
			const prompt = PromptTemplate.fromTemplate(`You're a software developer, solving errors displayed on the terminal, good luck with the conversation.`);

			const runnable = prompt.pipe(chat);
			const response = await runnable.invoke({ question: errorData });
			return response

		} catch (error) {
			console.log('Error creating solution', error);
			return vscode.window.showErrorMessage('Error analyzing and handling error: ' + error.message);
		}

	}



	// Display the response in the terminal function
	function displayResponseInTerminal(response) {
		const activeTerminal = vscode.window.activeTerminal;

		if (activeTerminal) {
			activeTerminal.show();
			activeTerminal.sendText(response);
		} else {
			const newTerminal = vscode.window.createTerminal('My Terminal');

			newTerminal.show();
			newTerminal.sendText(response);
		}
	}


	// Register a command that copies the terminal output to a file
	const disposable = vscode.commands.registerCommand('gpt-errors.analyzeError', async () => {
		vscode.window.showInformationMessage('"gpt-errors", Terminal Error Detection Extension running.');
	});

	context.subscriptions.push(disposable);
}

function deactivate() {
	vscode.window.showInformationMessage('gpt-errors extension deactivated.');
}

module.exports = {
	activate,
	deactivate
}