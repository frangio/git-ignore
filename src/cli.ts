#!/usr/bin/env node

import execa from 'execa';
import findUp from 'find-up';
import { promises as fs } from 'fs';
import ora from 'ora';
import path from 'path';
import { Command, flags } from '@oclif/command';

import * as gitignore from './git-ignore';

class GitIgnore extends Command {
  static args = [
    { name: 'template' },
  ]

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
  }

  async run() {
    const { args } = this.parse(GitIgnore);

    const templates = await this.trycatch(
      gitignore.listTemplates,
      'Fetching list of available templates',
      'Request failed'
    );

    if (args.template !== undefined) {
      const match = templates.find(t => streq(args.template, t));

      if (match === undefined) {
        this.error('No matching template found');
      } else {
        args.template = match;
      }
    } else {
      args.template = await this.chooser(templates);
    }

    const content = await gitignore.getTemplate(args.template);

    const gitDir = await findUp('.git', { type: 'directory' });

    if (gitDir === undefined) {
      return this.error('Could not locate a git repository');
    }

    await fs.appendFile(
      path.resolve(gitDir, '../.gitignore'),
      content,
    );
  }

  async chooser(choices: string[]): Promise<string> {
    const { stdout } = await execa('fzf', ['--height=10'], {
      input: choices.join('\n'),
      stderr: 'inherit',
    });

    return stdout;
  }

  async trycatch<T>(fn: () => Promise<T>, msg: string, error: string): Promise<T> {
    const spinner = ora(msg).start();
    try {
      const ret = await fn();
      spinner.stop();
      return ret;
    } catch (_) {
      spinner.stop();
      return this.error(error);
    }
  }
}

// case insensitive string equality
function streq(a: string, b: string): boolean {
  return 0 === a.localeCompare(b, undefined, {
    usage: 'search',
    sensitivity: 'base',
  });
}

GitIgnore.run().then(undefined, require('@oclif/errors/handle'));
