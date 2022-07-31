import { Spinner } from '@favware/colorette-spinner';
import { blueBright } from 'colorette';
import prompts from 'prompts';
import { jobs } from './jobs.mjs';

const response = await prompts([
  { type: 'text', name: 'name', message: "What's the name of your middleware?", initial: 'my-middleware' },
  { type: 'text', name: 'title', message: "What's the title case name of your middleware?", initial: 'MyMiddleware' },
  { type: 'text', name: 'description', message: 'Write a short description of your middleware', initial: 'A Josh middleware' },
  {
    type: 'select',
    name: 'umd',
    message: 'Can your middleware be used in a browser?',
    choices: [
      { title: 'Yes', value: true },
      { title: 'No', value: false }
    ]
  }
]);

if (response.name === undefined) process.exit(1);
if (response.title === undefined) process.exit(1);
if (response.umd === undefined) process.exit(1);

for (const job of jobs) {
  const spinner = new Spinner(job.description).start();

  await job.callback({ name: response.name, title: response.title, description: response.description, umd: response.umd }).catch((error) => {
    spinner.error({ text: error.message });
    console.log(error);
    process.exit(1);
  });

  spinner.success();
}

console.log(blueBright('Done!'));
