import Octokit from "@octokit/rest";

const octokit = new Octokit();

export async function listTemplates(): Promise<string[]> {
  const res = await octokit.repos.getContents({
    owner: 'github',
    repo: 'gitignore',
    path: '/',
  });

  if (Array.isArray(res.data)) {
    const names = res.data
      .map(d => d.name)
      .filter(n => /.\.gitignore$/.test(n))
      .map(n => n.replace(/\.gitignore$/, ''));

    return names;
  }

  return [];
}

export async function getTemplate(template: string): Promise<string> {
  const res = await octokit.repos.getContents({
    owner: 'github',
    repo: 'gitignore',
    path: '/' + template + '.gitignore',
  });

  if (Array.isArray(res.data)) {
    throw new Error('Expected a file but got a directory');
  }
  
  if (res.data.content) {
    return Buffer.from(res.data.content, 'base64').toString('utf8');
  } else {
    return '';
  }
}
