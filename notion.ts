import { Client } from '@notionhq/client';
import * as fs from 'fs';

interface NotionLink {
  url: string;
  timestamp: string;
  comment: string;
}

const notion = new Client({
  auth: process.env.NOTION_SECRET,
});

async function getAllPages(): Promise<any[]> {
  const pages: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const response = await notion.search({
      start_cursor: startCursor,
      filter: {
        property: 'object',
        value: 'page',
      },
    });

    pages.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor || undefined;
  }

  return pages;
}

async function getPageLinks(pageId: string): Promise<string[]> {
  const blocks = await notion.blocks.children.list({
    block_id: pageId,
  });

  const links: string[] = [];
  
  for (const block of blocks.results) {
    if ('paragraph' in block) {
      const richText = block.paragraph.rich_text;
      for (const text of richText) {
        if (text.href) {
          links.push(text.href);
        }
      }
    }
  }

  return links;
}

function getPageTitle(page: any): string {
  if (page.properties?.title?.title?.[0]?.plain_text) {
    return page.properties.title.title[0].plain_text;
  }
  return 'Untitled Page';
}

async function main() {
  try {
    console.log('📚 Fetching all pages...');
    const pages = await getAllPages();
    console.log(`Found ${pages.length} pages to process`);
    
    const allLinks: NotionLink[] = [];
    const seenUrls = new Set<string>();

    console.log('🔍 Processing pages...');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const links = await getPageLinks(page.id);
      const timestamp = new Date(page.created_time).toISOString();
      const title = getPageTitle(page);
      
      for (const url of links) {
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          allLinks.push({ url, timestamp, comment: title });
        }
      }
      
      // Show progress
      const progress = ((i + 1) / pages.length * 100).toFixed(1);
      process.stdout.write(`\rProgress: ${progress}% (${i + 1}/${pages.length} pages)`);
    }
    console.log('\n'); // New line after progress

    // Sort by timestamp descending
    allLinks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Write to CSV
    const csvContent = ['url,timestamp,comment'];
    for (const link of allLinks) {
      // Escape commas in comment and wrap in quotes if needed
      const escapedComment = link.comment.includes(',') ? `"${link.comment}"` : link.comment;
      csvContent.push(`${link.url},${link.timestamp},${escapedComment}`);
    }

    fs.writeFileSync('notion-links.csv', csvContent.join('\n'));
    console.log(`✅ Successfully wrote ${allLinks.length} unique links to notion-links.csv`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
