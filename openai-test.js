const OpenAI = require('openai');

const openai = new OpenAI();

async function main(content) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content }],
      model: 'gpt-3.5-turbo',
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error(error);
    throw new Error('Error in OpenAI completion');
  }
}

async function iniciarConversacion(mensajeInicial) {
  try {
    // Envía el primer mensaje al chatbot
    const respuestaInicial = await main(mensajeInicial);
    return respuestaInicial;
  } catch (error) {
    console.error('Error al iniciar la conversación:', error);
    throw error;
  }
}

module.exports = {
  main,
  iniciarConversacion
};