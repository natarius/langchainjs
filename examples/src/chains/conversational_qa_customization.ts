import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { BufferMemory } from "langchain/memory";
import * as fs from "fs";

export const run = async () => {
  const text = fs.readFileSync("state_of_the_union.txt", "utf8");
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([text]);
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  const fasterModel = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
  });
  const slowerModel = new ChatOpenAI({
    modelName: "gpt-4",
  });
  const chain = ConversationalRetrievalQAChain.fromLLM(
    slowerModel,
    vectorStore.asRetriever(),
    {
      memory: new BufferMemory({
        memoryKey: "chat_history",
        returnMessages: true,
      }),
      questionGeneratorChainOptions: {
        llm: fasterModel,
      },
    }
  );
  /* Ask it a question */
  const question = "What did the president say about Justice Breyer?";
  const res = await chain.call({ question });
  console.log(res);

  const followUpRes = await chain.call({ question: "Was that nice?" });
  console.log(followUpRes);
};
